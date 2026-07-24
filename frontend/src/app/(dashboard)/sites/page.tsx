'use client';

import { usePermission } from '@/hooks/usePermission';
import { useCrudPermission } from '@/hooks/useCrudPermission';
import { isWithinScope } from '@/utils/scopeFilter';
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useRouter } from 'next/navigation';
import StatusChip from '@/components/molecules/StatusChip';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import SiteForm from '@/features/sites/SiteForm';
import RowActionsMenu from '@/components/molecules/RowActionsMenu';
import type { Site, CreateSiteDto } from '@/types/site';
import { useGetBoqsQuery } from '@/store/api/boqApi';
import {
  useCreateSiteMutation,
  useDeleteSiteMutation,
  useGetSitesQuery,
  useUpdateSiteMutation,
} from '@/store/api/siteApi';
import {
  useGetDistrictsQuery,
  useGetProvincesQuery,
  useGetTownsQuery,
} from '@/store/api/provinceApi';

export default function SitesPage() {
  const router = useRouter();
  const { provinceIds, siteIds } = usePermission();
  const { canCreate, canUpdate, canDelete } = useCrudPermission('/sites');

  const { data: sitesData, isLoading } = useGetSitesQuery({ page_size: 200 });
  const { data: provincesData } = useGetProvincesQuery({ page_size: 100 });
  const { data: districtsData } = useGetDistrictsQuery({ page_size: 500 });
  const { data: townsData } = useGetTownsQuery({ page_size: 500 });
  const { data: boqsData } = useGetBoqsQuery({ page_size: 100 });

  const [createSite] = useCreateSiteMutation();
  const [updateSite] = useUpdateSiteMutation();
  const [deleteSite] = useDeleteSiteMutation();

  const provinces = provincesData?.data ?? [];
  const districts = districtsData?.data ?? [];
  const towns = townsData?.data ?? [];
  const sites = sitesData?.data ?? [];
  const apiBoqs = boqsData?.data ?? [];

  const [open, setOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null);

  useEffect(() => {
    document.title = 'Sites | SC-GIMS';
  }, []);

  const siteProvinceId = (site: Site) =>
    site.province_id ?? towns.find((t) => t.id === site.town_id)?.province_id;

  const siteDistrictId = (site: Site) =>
    site.district_id ?? towns.find((t) => t.id === site.town_id)?.district_id;

  const visibleSites = sites.filter((site) =>
    isWithinScope({ provinceIds, siteIds }, siteProvinceId(site), site.id)
  );

  const openCreate = () => {
    setEditingSite(null);
    setOpen(true);
  };

  const openEdit = (site: Site) => {
    setEditingSite(site);
    setOpen(true);
  };

  const handleFormSubmit = async (data: CreateSiteDto) => {
    try {
      if (editingSite) {
        await updateSite({ id: editingSite.id, data }).unwrap();
      } else {
        await createSite(data).unwrap();
      }
      setOpen(false);
    } catch {
      setBlockedMessage('Failed to save site. Please try again.');
    }
  };

  const handleDelete = (site: Site) => {
    const blockers: string[] = [];
    const boqCount = apiBoqs.filter((b) => String(b.site_id) === String(site.id)).length;

    if (boqCount > 0) blockers.push(`${boqCount} BOQ(s)`);

    if (blockers.length > 0) {
      setBlockedMessage(
        `Cannot delete ${site.name} — still referenced by ${blockers.join(', ')}. Reassign or remove these first.`
      );
      return;
    }
    setBlockedMessage(null);
    setSiteToDelete(site);
  };

  const confirmDelete = async () => {
    if (siteToDelete) {
      try {
        await deleteSite(siteToDelete.id).unwrap();
      } catch {
        setBlockedMessage('Failed to delete site. Please try again.');
      }
    }
    setSiteToDelete(null);
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          Sites
        </Typography>
        {canCreate && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Create Site
          </Button>
        )}
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Sites are grouped by province, district, and town.
      </Typography>

      {blockedMessage && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setBlockedMessage(null)}>
          {blockedMessage}
        </Alert>
      )}

      {provinces.map((province) => {
        const districtsInProvince = districts.filter((d) => d.province_id === province.id);
        const sitesInProvince = visibleSites.filter(
          (s) => siteProvinceId(s) === province.id
        );

        if (sitesInProvince.length === 0) return null;

        return (
          <Paper key={province.id} sx={{ mb: 3, p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              {province.name} <Chip label={sitesInProvince.length} size="small" sx={{ ml: 1 }} />
            </Typography>

            {districtsInProvince.map((district) => {
              const townsInDistrict = towns.filter((t) => t.district_id === district.id);
              const sitesInDistrict = sitesInProvince.filter(
                (s) => siteDistrictId(s) === district.id
              );
              if (sitesInDistrict.length === 0) return null;

              return (
                <Box key={district.id} sx={{ mb: 2, pl: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    {district.name}
                  </Typography>

                  {townsInDistrict.map((town) => {
                    const sitesInTown = sitesInDistrict.filter((s) => s.town_id === town.id);
                    if (sitesInTown.length === 0) return null;

                    return (
                      <Box key={town.id} sx={{ mb: 2, pl: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                          {town.name}
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {sitesInTown.map((site) => (
                            <Box
                              key={site.id}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 1.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography
                                  sx={{
                                    fontWeight: 600,
                                    color: 'primary.main',
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                  }}
                                  onClick={() => router.push(`/sites/${site.id}`)}
                                >
                                  {site.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {site.location}
                                </Typography>
                                <StatusChip status={site.status} />
                              </Box>
                              <RowActionsMenu
                                actions={[
                                  {
                                    key: 'view',
                                    label: 'View',
                                    icon: <VisibilityIcon fontSize="small" />,
                                    onClick: () => router.push(`/sites/${site.id}`),
                                  },
                                  ...(canUpdate
                                    ? [
                                        {
                                          key: 'edit',
                                          label: 'Edit',
                                          icon: <EditIcon fontSize="small" />,
                                          onClick: () => openEdit(site),
                                        },
                                      ]
                                    : []),
                                  ...(canDelete
                                    ? [
                                        {
                                          key: 'delete',
                                          label: 'Delete',
                                          icon: <DeleteIcon fontSize="small" />,
                                          destructive: true,
                                          dividerBefore: true,
                                          onClick: () => handleDelete(site),
                                        },
                                      ]
                                    : []),
                                ]}
                              />
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              );
            })}
          </Paper>
        );
      })}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingSite ? 'Edit Site' : 'Create Site'}</DialogTitle>
        <DialogContent>
          <SiteForm
            defaultValues={
              editingSite
                ? {
                    project_id: editingSite.project_id,
                    district_id: siteDistrictId(editingSite) ?? '',
                    town_id: editingSite.town_id,
                    name: editingSite.name,
                    location: editingSite.location,
                    latitude: editingSite.latitude,
                    longitude: editingSite.longitude,
                    geofence_radius_m: editingSite.geofence_radius_m,
                  }
                : {
                    project_id: '',
                    district_id: '',
                    town_id: '',
                    name: '',
                    location: '',
                    geofence_radius_m: 500,
                  }
            }
            onSubmit={handleFormSubmit}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!siteToDelete} onClose={() => setSiteToDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Site</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            Are you sure you want to delete <strong>{siteToDelete?.name}</strong>? This action
            cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setSiteToDelete(null)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDelete}>
              Delete
            </Button>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
