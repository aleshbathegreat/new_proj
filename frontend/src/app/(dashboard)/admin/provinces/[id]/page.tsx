'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import MapIcon from '@mui/icons-material/Map';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RowActionsMenu from '@/components/molecules/RowActionsMenu';
import type { District } from '@/types/site';
import {
  useCreateDistrictMutation,
  useDeleteDistrictMutation,
  useGetDistrictsQuery,
  useGetProvinceQuery,
  useUpdateDistrictMutation,
} from '@/store/api/provinceApi';
import { useGetSitesQuery } from '@/store/api/siteApi';

const emptyForm = { name: '', code: '' };

export default function ProvinceDistrictsPage() {
  const params = useParams();
  const router = useRouter();
  const provinceId = params.id as string;

  const {
    data: province,
    isError: provinceError,
    isLoading: isProvinceLoading,
  } = useGetProvinceQuery(provinceId);
  const { data: districtsData } = useGetDistrictsQuery({ province_id: provinceId, page_size: 200 });
  const { data: sitesData } = useGetSitesQuery({ province_id: provinceId, page_size: 500 });

  const [createDistrict] = useCreateDistrictMutation();
  const [updateDistrict] = useUpdateDistrictMutation();
  const [deleteDistrict] = useDeleteDistrictMutation();

  const districtsInProvince = districtsData?.data ?? [];
  const sites = sitesData?.data ?? [];

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [districtToDelete, setDistrictToDelete] = useState<District | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = province ? `${province.name} Districts | SC-GIMS` : 'Districts | SC-GIMS';
  }, [province]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (district: District) => {
    setEditingId(district.id);
    setForm({ name: district.name, code: district.code });
    setOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateDistrict({
          id: editingId,
          data: { name: form.name, code: form.code.toUpperCase() },
        }).unwrap();
      } else {
        await createDistrict({
          name: form.name,
          code: form.code.toUpperCase(),
          province_id: provinceId,
        }).unwrap();
      }
      setOpen(false);
    } catch {
      setBlockedMessage('Failed to save district. Please try again.');
    }
  };

  const requestDelete = (district: District) => {
    const sitesInDistrict = sites.filter((s) => s.district_id === district.id);
    if (sitesInDistrict.length > 0) {
      setBlockedMessage(
        `Cannot delete ${district.name} — still referenced by ${sitesInDistrict.length} site(s). Reassign or remove those sites first.`
      );
      return;
    }
    setBlockedMessage(null);
    setDistrictToDelete(district);
  };

  const confirmDelete = async () => {
    if (districtToDelete) {
      try {
        await deleteDistrict(districtToDelete.id).unwrap();
      } catch {
        setBlockedMessage('Failed to delete district. Please try again.');
      }
    }
    setDistrictToDelete(null);
  };

  if (provinceError) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/admin/provinces')}
          sx={{ mb: 2 }}
        >
          Back to Provinces
        </Button>

        <Alert severity="error">Failed to load province details.</Alert>
      </Box>
    );
  }

  if (isProvinceLoading || !province) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/admin/provinces')}
          sx={{ mb: 2 }}
        >
          Back to Provinces
        </Button>

        <Typography>Loading province...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push('/admin/provinces')}
        sx={{ mb: 2 }}
      >
        Back to Provinces
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          {province.name} — Districts
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Add District
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Click a district to view its sites.
      </Typography>

      {blockedMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setBlockedMessage(null)}>
          {blockedMessage}
        </Alert>
      )}

      {districtsInProvince.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No districts added yet for {province.name}.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {districtsInProvince.map((district) => {
            const siteCount = sites.filter((s) => s.district_id === district.id).length;
            return (
              <Grid key={district.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper
                  onClick={() => router.push(`/admin/districts/${district.id}`)}
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
                    <MapIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                    <RowActionsMenu
                      actions={[
                        {
                          key: 'view',
                          label: 'View sites',
                          icon: <VisibilityIcon fontSize="small" />,
                          onClick: () => router.push(`/admin/districts/${district.id}`),
                        },
                        {
                          key: 'edit',
                          label: 'Edit',
                          icon: <EditIcon fontSize="small" />,
                          onClick: () => openEdit(district),
                        },
                        {
                          key: 'delete',
                          label: 'Delete',
                          icon: <DeleteIcon fontSize="small" />,
                          destructive: true,
                          dividerBefore: true,
                          onClick: () => requestDelete(district),
                        },
                      ]}
                    />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {district.name}
                  </Typography>
                  <Chip label={district.code} size="small" variant="outlined" sx={{ mt: 0.5, mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    {siteCount} site{siteCount === 1 ? '' : 's'}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit District' : 'Add District'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="District Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Code (e.g. KHI)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name || !form.code}>
            {editingId ? 'Save Changes' : 'Add District'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!districtToDelete} onClose={() => setDistrictToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete District</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            Are you sure you want to delete <strong>{districtToDelete?.name}</strong>? This action
            cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setDistrictToDelete(null)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDelete}>
              Delete
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}