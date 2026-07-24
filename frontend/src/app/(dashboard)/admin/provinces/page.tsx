'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PublicIcon from '@mui/icons-material/Public';
import MapIcon from '@mui/icons-material/Map';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RowActionsMenu from '@/components/molecules/RowActionsMenu';
import type { Province } from '@/types/site';
import {
  useCreateProvinceMutation,
  useDeleteProvinceMutation,
  useGetDistrictsQuery,
  useGetProvincesQuery,
  useUpdateProvinceMutation,
} from '@/store/api/provinceApi';
import { useGetProjectsQuery } from '@/store/api/projectApi';
import { useGetUsersQuery } from '@/store/api/userApi';

const emptyForm = { name: '', code: '' };

export default function ProvinceManagementPage() {
  const router = useRouter();
  const { data: provincesData } = useGetProvincesQuery({ page_size: 100 });
  const { data: districtsData } = useGetDistrictsQuery({ page_size: 500 });
  const { data: projectsData } = useGetProjectsQuery({ page_size: 200 });
  const { data: usersData } = useGetUsersQuery({ page_size: 500 });

  const [createProvince] = useCreateProvinceMutation();
  const [updateProvince] = useUpdateProvinceMutation();
  const [deleteProvince] = useDeleteProvinceMutation();

  const provinces = provincesData?.data ?? [];
  const districts = districtsData?.data ?? [];
  const projects = projectsData?.data ?? [];
  const users = usersData?.data ?? [];

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [provinceToDelete, setProvinceToDelete] = useState<Province | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Provinces, Districts & Towns | SC-GIMS';
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (province: Province) => {
    setEditingId(province.id);
    setForm({ name: province.name, code: province.code });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateProvince({
          id: editingId,
          data: { name: form.name, code: form.code.toUpperCase() },
        }).unwrap();
      } else {
        await createProvince({ name: form.name, code: form.code.toUpperCase() }).unwrap();
      }
      setOpen(false);
    } catch {
      setBlockedMessage('Failed to save province. Please try again.');
    }
  };

  const requestDelete = (province: Province) => {
    const districtsInProvince = districts.filter((d) => d.province_id === province.id);
    const projectsInProvince = projects.filter((p) => p.province_id === province.id);
    const usersInProvince = users.filter((u) => u.province_ids.includes(province.id));
    const blockers: string[] = [];
    if (districtsInProvince.length > 0) blockers.push(`${districtsInProvince.length} districts`);
    if (projectsInProvince.length > 0) blockers.push(`${projectsInProvince.length} projects`);
    if (usersInProvince.length > 0) blockers.push(`${usersInProvince.length} users`);

    if (blockers.length > 0) {
      setBlockedMessage(
        `Cannot delete ${province.name} — still referenced by ${blockers.join(', ')}. Reassign or remove these first.`
      );
      return;
    }
    setBlockedMessage(null);
    setProvinceToDelete(province);
  };

  const confirmDelete = async () => {
    if (provinceToDelete) {
      try {
        await deleteProvince(provinceToDelete.id).unwrap();
      } catch {
        setBlockedMessage('Failed to delete province. Please try again.');
      }
    }
    setProvinceToDelete(null);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          Provinces, Districts & Towns
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add Province
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Click a province to manage its districts.
      </Typography>

      {blockedMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setBlockedMessage(null)}>
          {blockedMessage}
        </Alert>
      )}

      <Grid container spacing={2}>
        {provinces.map((province) => {
          const districtCount = districts.filter((d) => d.province_id === province.id).length;
          return (
            <Grid key={province.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper
                onClick={() => router.push(`/admin/provinces/${province.id}`)}
                sx={{
                  p: 3,
                  cursor: 'pointer',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  transition: 'box-shadow 0.25s ease, transform 0.25s ease',
                  '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <PublicIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                  <RowActionsMenu
                    actions={[
                      {
                        key: 'view',
                        label: 'View districts',
                        icon: <VisibilityIcon fontSize="small" />,
                        onClick: () => router.push(`/admin/provinces/${province.id}`),
                      },
                      {
                        key: 'edit',
                        label: 'Edit',
                        icon: <EditIcon fontSize="small" />,
                        onClick: () => openEdit(province),
                      },
                      {
                        key: 'delete',
                        label: 'Delete',
                        icon: <DeleteIcon fontSize="small" />,
                        destructive: true,
                        dividerBefore: true,
                        onClick: () => requestDelete(province),
                      },
                    ]}
                  />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {province.name}
                </Typography>
                <Chip
                  label={province.code}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 0.5, mb: 1 }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MapIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {districtCount} district{districtCount === 1 ? '' : 's'}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Province' : 'Add Province'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Province Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Code (e.g. SINDH)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name || !form.code}>
            {editingId ? 'Save Changes' : 'Add Province'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!provinceToDelete}
        onClose={() => setProvinceToDelete(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Province</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            Are you sure you want to delete <strong>{provinceToDelete?.name}</strong>? This action
            cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setProvinceToDelete(null)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDelete}>
              Delete
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
