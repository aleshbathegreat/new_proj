'use client';

import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Toast from '@/components/atoms/Toast';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import DataTable from '@/components/organisms/DataTable';
import { useCrudPermission } from '@/hooks/useCrudPermission';
import { useGetProjectsQuery } from '@/store/api/projectApi';
import { useGetDistrictsQuery } from '@/store/api/provinceApi';
import { useGetSitesQuery } from '@/store/api/siteApi';
import { useGetBoqsQuery, useGetBoqItemsQuery } from '@/store/api/boqApi';
import {
  useGetKPICategoriesQuery,
  useCreateKPICategoryMutation,
  useGetSiteProgressTasksQuery,
  useCreateSiteProgressTaskMutation,
} from '@/store/api/progressApi';
import type { SiteProgressTask } from '@/types/dailyProgress';
import Autocomplete from '@mui/material/Autocomplete';
import { useGetModuleCatalogQuery, useGetItemCatalogQuery } from '@/store/api/progressApi';
import EditIcon from '@mui/icons-material/Edit';
import { useUpdateKPICategoryMutation, useDeleteKPICategoryMutation } from '@/store/api/progressApi';
import { useUpdateSiteProgressTaskMutation, useDeleteSiteProgressTaskMutation } from '@/store/api/progressApi';

/** Sentinel value for the Site dropdown meaning "district-level, no specific site". */
const DISTRICT_LEVEL_VALUE = 'none';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export default function TasksPage() {
  const { canCreate } = useCrudPermission('/tasks');

  const [projectId, setProjectId] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [siteId, setSiteId] = useState(''); // '' = not chosen yet, DISTRICT_LEVEL_VALUE = district-level, otherwise a real site id
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');

  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [updateSubtask] = useUpdateSiteProgressTaskMutation();
  const [deleteSubtask] = useDeleteSiteProgressTaskMutation();

  const [subtaskDialogOpen, setSubtaskDialogOpen] = useState(false);
  const [subtaskName, setSubtaskName] = useState('');
  const [linkMode, setLinkMode] = useState<'boq' | 'manual'>('manual');
  const [selectedBoqItemId, setSelectedBoqItemId] = useState('');
  const [manualUnit, setManualUnit] = useState('unit');
  const [manualPlannedQty, setManualPlannedQty] = useState('');
  const [itemNotes, setItemNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'warning' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    document.title = 'Tasks | SC-GIMS';
  }, []);

  const { data: projectsData, isLoading: loadingProjects } = useGetProjectsQuery({ page_size: 200 });
  const projects = projectsData?.data ?? [];
  const selectedProject = projects.find((p) => p.id === projectId);

  const { data: districtsData, isLoading: loadingDistricts } = useGetDistrictsQuery(
    { province_id: selectedProject?.province_id, page_size: 200 },
    { skip: !selectedProject?.province_id }
  );
  const districts = districtsData?.data ?? [];

  const { data: sitesData, isLoading: loadingSites } = useGetSitesQuery(
    { project_id: projectId, district_id: districtId, page_size: 200 },
    { skip: !projectId || !districtId }
  );
  const sites = sitesData?.data ?? [];

  const isDistrictLevel = siteId === DISTRICT_LEVEL_VALUE;
  // Scope is "ready" once project + district + an explicit site choice
  // (a real site, OR the district-level sentinel) are all set.
  const scopeReady = !!projectId && !!districtId && !!siteId;
  const scopeLabel = isDistrictLevel
    ? districts.find((d) => d.id === districtId)?.name ?? 'district'
    : sites.find((s) => s.id === siteId)?.name ?? 'site';

  const { data: categoriesData, isLoading: loadingCategories, refetch: refetchCategories } =
    useGetKPICategoriesQuery(
      { project_id: projectId, district_id: districtId, site_id: siteId, page_size: 100 },
      { skip: !scopeReady }
    );
  const categories = categoriesData?.data ?? [];

  const { data: tasksData, isLoading: loadingTasks, refetch: refetchTasks } =
    useGetSiteProgressTasksQuery(
      { project_id: projectId, district_id: districtId, site_id: siteId, page_size: 200 },
      { skip: !scopeReady }
    );
  const allSubtasksInScope = tasksData?.data ?? [];
  const subtasksInCategory = allSubtasksInScope.filter((t) => t.kpi_category_id === selectedCategoryId);

  // BOQ items for the picker. Site-level: use the site's BOQ with the most
  // items. District-level (no site): use the project's BOQ with the most
  // items instead, since BOQ is project-scoped, not site-scoped.
  const { data: siteBoqsData } = useGetBoqsQuery(
    { site_id: siteId, page_size: 50 },
    { skip: !siteId || isDistrictLevel }
  );
  const { data: projectBoqsData } = useGetBoqsQuery(
    { project_id: projectId, page_size: 50 },
    { skip: !projectId || !isDistrictLevel }
  );
  const boqForScope = useMemo(() => {
    const boqs = (isDistrictLevel ? projectBoqsData?.data : siteBoqsData?.data) ?? [];
    if (boqs.length === 0) return null;
    return [...boqs].sort((a, b) => b.items_count - a.items_count)[0];
  }, [isDistrictLevel, projectBoqsData, siteBoqsData]);
  const { data: boqItemsData } = useGetBoqItemsQuery(boqForScope?.id ?? '', { skip: !boqForScope?.id });
  const boqItems = boqItemsData?.data ?? [];
  const selectedBoqItem = boqItems.find((i) => i.id === selectedBoqItemId);

  const [createCategory] = useCreateKPICategoryMutation();
  const [updateCategory] = useUpdateKPICategoryMutation();
  const [deleteCategory] = useDeleteKPICategoryMutation();
  const [createSubtask] = useCreateSiteProgressTaskMutation();

  useEffect(() => {
    setDistrictId('');
    setSiteId('');
  }, [projectId]);

  useEffect(() => {
    setSiteId('');
  }, [districtId]);

  useEffect(() => {
    setSelectedCategoryId('');
  }, [siteId]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !scopeReady) return;
    try {
      const created = await createCategory({
        project_id: projectId,
        district_id: districtId,
        site_id: isDistrictLevel ? null : siteId,
        name: newCategoryName.trim(),
      }).unwrap();
      setToast({ open: true, message: `MODULE "${created.name}" created`, severity: 'success' });
      setNewCategoryName('');
      setAddingCategory(false);
      refetchCategories();
    } catch (e) {
      setToast({
        open: true,
        message: (e as { data?: { name?: string[] } })?.data?.name?.[0] || 'Failed to create module',
        severity: 'error',
      });
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editCategoryName.trim()) return;
    try {
      await updateCategory({ id, data: { name: editCategoryName.trim() } }).unwrap();
      setToast({ open: true, message: 'Module updated', severity: 'success' });
      setEditingCategoryId(null);
      refetchCategories();
    } catch (e) {
      setToast({
        open: true,
        message: (e as { data?: { name?: string[] } })?.data?.name?.[0] || 'Failed to update module',
        severity: 'error',
      });
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Its items will remain but become unassigned.`)) return;
    try {
      await deleteCategory(id).unwrap();
      setToast({ open: true, message: 'Module deleted', severity: 'success' });
      if (selectedCategoryId === id) setSelectedCategoryId('');
      refetchCategories();
    } catch (e) {
      setToast({
        open: true,
        message: (e as { data?: { detail?: string } })?.data?.detail || 'Failed to delete module',
        severity: 'error',
      });
    }
  };

  const openSubtaskDialog = (existing?: SiteProgressTask) => {
    if (existing) {
      setEditingSubtaskId(existing.id);
      setSubtaskName(existing.name);
      if (existing.boq_item_id) {
        setLinkMode('boq');
        setSelectedBoqItemId(existing.boq_item_id);
      } else {
        setLinkMode('manual');
        setSelectedBoqItemId('');
        setManualUnit(existing.unit);
        setManualPlannedQty(String(existing.planned_quantity));
      }
      setItemNotes((existing.attributes as Record<string, string>)?.notes ?? '');
    } else {
      setEditingSubtaskId(null);
      setSubtaskName('');
      setLinkMode('manual');
      setSelectedBoqItemId('');
      setManualUnit('unit');
      setManualPlannedQty('');
      setItemNotes('');
    }
    setSubtaskDialogOpen(true);
  };

  const { data: moduleCatalogData } = useGetModuleCatalogQuery();
  const moduleCatalog = moduleCatalogData?.data ?? [];

  const { data: itemCatalogData } = useGetItemCatalogQuery();
  const itemCatalog = itemCatalogData?.data ?? [];

  const handleDeleteSubtask = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await deleteSubtask(id).unwrap();
      setToast({ open: true, message: 'Item deleted', severity: 'success' });
      refetchTasks();
      refetchCategories();
    } catch (e) {
      const detail = (e as { data?: { detail?: string; blocking_items?: string[] } })?.data;
      setToast({
        open: true,
        message: detail?.blocking_items
          ? `Cannot delete — progress already logged: ${detail.blocking_items.join(', ')}`
          : detail?.detail || 'Failed to delete item',
        severity: 'error',
      });
    }
  };

  const handleCreateSubtask = async () => {
    if (!subtaskName.trim() || !scopeReady || !selectedCategoryId) return;
    if (linkMode === 'boq' && !selectedBoqItemId) {
      setToast({ open: true, message: 'Select a BOQ item, or switch to manual entry.', severity: 'warning' });
      return;
    }
    if (linkMode === 'manual' && !manualPlannedQty) {
      setToast({ open: true, message: 'Enter a planned quantity.', severity: 'warning' });
      return;
    }

    setSaving(true);
    try {
      if (editingSubtaskId) {
        await updateSubtask({
          id: editingSubtaskId,
          data: {
            name: subtaskName.trim(),
            unit: linkMode === 'boq' ? (selectedBoqItem?.unit ?? 'unit') : manualUnit,
            planned_quantity:
              linkMode === 'boq' ? Number(selectedBoqItem?.qty ?? 0) : Number(manualPlannedQty),
            boq_item_id: linkMode === 'boq' ? selectedBoqItemId : null,
            attributes: { notes: itemNotes.trim() },
          },
        }).unwrap();
        setToast({ open: true, message: 'Item updated', severity: 'success' });
      } else {
        await createSubtask({
          project_id: projectId,
          district_id: districtId,
          site_id: isDistrictLevel ? null : siteId,
          kpi_category_id: selectedCategoryId,
          key: `${slugify(subtaskName)}_${Date.now().toString(36)}`,
          name: subtaskName.trim(),
          unit: linkMode === 'boq' ? (selectedBoqItem?.unit ?? 'unit') : manualUnit,
          planned_quantity:
            linkMode === 'boq' ? Number(selectedBoqItem?.qty ?? 0) : Number(manualPlannedQty),
          boq_item_id: linkMode === 'boq' ? selectedBoqItemId : undefined,
          attributes: { notes: itemNotes.trim() },
        }).unwrap();
        setToast({ open: true, message: 'Item created', severity: 'success' });
      }
      setSubtaskDialogOpen(false);
      setEditingSubtaskId(null);
      refetchTasks();
      refetchCategories();
    } catch (e) {
      setToast({
        open: true,
        message:
          (e as { data?: { detail?: string } })?.data?.detail ||
          `Failed to ${editingSubtaskId ? 'update' : 'create'} item`,
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadingProjects) return <PageSkeleton />;

  return (
    <Box>
      <Typography variant="h5" component="h1" sx={{ mb: 0.5 }}>
        Tasks
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Define Module and Items per site, or at the district level when a project has no sites yet.
        These become selectable in Work Progress.
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            select
            label="Project"
            size="small"
            sx={{ minWidth: 240 }}
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <MenuItem value="">Select project</MenuItem>
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="District"
            size="small"
            sx={{ minWidth: 200 }}
            value={districtId}
            onChange={(e) => setDistrictId(e.target.value)}
            disabled={!projectId || loadingDistricts}
          >
            <MenuItem value="">Select district</MenuItem>
            {districts.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Site"
            size="small"
            sx={{ minWidth: 260 }}
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            disabled={!districtId || loadingSites}
          >
            <MenuItem value="">Select site</MenuItem>
            <MenuItem value={DISTRICT_LEVEL_VALUE}>
              <em>— District level (no specific site) —</em>
            </MenuItem>
            {sites.map((s) => (
              <MenuItem key={s.id} value={s.id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {!scopeReady ? (
        <Alert severity="info">
          Select a Project and District, then either pick a Site or choose &quot;District level&quot; to manage its tasks.
        </Alert>
      ) : (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
          {/* KPI Categories panel */}
          <Paper sx={{ p: 2, flex: 1, minWidth: 260 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle1">MODULE</Typography>
              {canCreate && (
                <IconButton size="small" onClick={() => setAddingCategory((v) => !v)}>
                  <AddIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            {addingCategory && (
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Autocomplete
                  freeSolo
                  options={moduleCatalog.map((m) => m.name)}
                  inputValue={newCategoryName}
                  onInputChange={(_, value) => setNewCategoryName(value)}
                  sx={{ flex: 1 }}
                  renderInput={(params) => (
                    <TextField {...params} size="small" placeholder="e.g. Electrical" />
                  )}
                />
                <Button variant="contained" size="small" onClick={handleAddCategory}>
                  Add
                </Button>
              </Stack>
            )}
            {loadingCategories ? (
              <PageSkeleton />
            ) : categories.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No MODULES yet for this {isDistrictLevel ? 'district' : 'site'}.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {categories.map((c) => (
                  <Box
                    key={c.id}
                    sx={{
                      p: 1.2,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: c.id === selectedCategoryId ? 'primary.main' : 'divider',
                      bgcolor: c.id === selectedCategoryId ? 'primary.50' : 'transparent',
                    }}
                  >
                    {editingCategoryId === c.id ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          size="small"
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          fullWidth
                          autoFocus
                        />
                        <Button size="small" onClick={() => handleUpdateCategory(c.id)}>
                          Save
                        </Button>
                        <Button size="small" onClick={() => setEditingCategoryId(null)}>
                          Cancel
                        </Button>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ cursor: 'pointer', flex: 1 }} onClick={() => setSelectedCategoryId(c.id)}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {c.name}
                          </Typography>
                        </Box>
                        <Chip size="small" label={c.subtask_count} sx={{ mr: 1 }} />
                        {canCreate && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingCategoryId(c.id);
                                setEditCategoryName(c.name);
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => handleDeleteCategory(c.id, c.name)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </Box>
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>

          {/* Subtasks panel */}
          <Paper sx={{ p: 2, flex: 2.2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="subtitle1">
                {selectedCategoryId
                  ? `Items — ${categories.find((c) => c.id === selectedCategoryId)?.name ?? ''}`
                  : 'Items'}
              </Typography>
              {canCreate && selectedCategoryId && (
                <Button size="small" startIcon={<AddIcon />} onClick={() => openSubtaskDialog()}>
                  Add Item
                </Button>
              )}
            </Box>

            {!selectedCategoryId ? (
              <Alert severity="info">Select a Module on the left.</Alert>
            ) : loadingTasks ? (
              <PageSkeleton />
            ) : (
              <DataTable
                rows={subtasksInCategory}
                columns={[
                  { field: 'name', headerName: 'Item', flex: 1.2 },
                  {
                    field: 'boq_item_code',
                    headerName: 'BOQ Item',
                    flex: 0.9,
                    renderCell: ({ row }) => row.boq_item_code || 'Manual entry',
                  },
                  {
                    field: 'planned_quantity',
                    headerName: 'Planned',
                    flex: 0.7,
                    renderCell: ({ row }) => Number(row.planned_quantity).toLocaleString(),
                  },
                  {
                    field: 'attributes',
                    headerName: 'Notes',
                    flex: 1,
                    renderCell: ({ row }: { row: SiteProgressTask }) =>
                      (row.attributes as Record<string, string>)?.notes || '—',
                  },
                  {
                    field: 'actions',
                    headerName: '',
                    flex: 0.6,
                    renderCell: ({ row }: { row: SiteProgressTask }) => (
                      <Stack direction="row" spacing={0.5}>
                        <IconButton size="small" onClick={() => openSubtaskDialog(row)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteSubtask(row.id, row.name)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    ),
                  },
                ]}
                rowCount={subtasksInCategory.length}
                paginationModel={{ page: 0, pageSize: 25 }}
                onPaginationModelChange={() => {}}
              />
            )}
          </Paper>
        </Stack>
      )}

      <Dialog open={subtaskDialogOpen} onClose={() => setSubtaskDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSubtaskId ? 'Edit Item' : 'New Item'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Autocomplete
              freeSolo
              options={itemCatalog.map((i) => i.name)}
              inputValue={subtaskName}
              onInputChange={(_, value) => setSubtaskName(value)}
              onChange={(_, value) => {
                if (value) {
                  const matched = itemCatalog.find((i) => i.name === value);
                  if (matched?.default_unit && linkMode === 'manual') {
                    setManualUnit(matched.default_unit);
                  }
                }
              }}
              fullWidth
              renderInput={(params) => (
                <TextField {...params} label="Item name" autoFocus />
              )}
            />

            <RadioGroup
              row
              value={linkMode}
              onChange={(e) => setLinkMode(e.target.value as 'boq' | 'manual')}
            >
              <FormControlLabel value="boq" control={<Radio />} label="Link to BOQ item" />
              <FormControlLabel value="manual" control={<Radio />} label="Enter manually" />
            </RadioGroup>

            {linkMode === 'boq' ? (
              boqItems.length === 0 ? (
                <Alert severity="warning">
                  No BOQ items found for this {isDistrictLevel ? 'project' : 'site'}.
                </Alert>
              ) : (
                <TextField
                  select
                  label="BOQ item"
                  value={selectedBoqItemId}
                  onChange={(e) => setSelectedBoqItemId(e.target.value)}
                  fullWidth
                  helperText={
                    selectedBoqItem
                      ? `Planned: ${selectedBoqItem.qty}`
                      : undefined
                  }
                >
                  {boqItems.map((item) => (
                    <MenuItem key={item.id} value={item.id}>
                      {item.item} — {item.item_description}
                    </MenuItem>
                  ))}
                </TextField>
              )
            ) : (
              <TextField
                label="Planned quantity"
                type="number"
                value={manualPlannedQty}
                onChange={(e) => setManualPlannedQty(e.target.value)}
                fullWidth
              />
            )}

            <TextField
              label="Additional Notes"
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              placeholder="Any extra detail about this item"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubtaskDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateSubtask} disabled={saving}>
            {saving ? 'Saving…' : editingSubtaskId ? 'Save Changes' : 'Create Item'}
          </Button>
        </DialogActions>
      </Dialog>

      <Toast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </Box>
  );
}