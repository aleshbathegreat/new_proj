'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RowActionsMenu from '@/components/molecules/RowActionsMenu';
import StatusChip from '@/components/molecules/StatusChip';
import { useGetDistrictQuery } from '@/store/api/provinceApi';
import { useGetSitesQuery } from '@/store/api/siteApi';

export default function DistrictSitesPage() {
  const params = useParams();
  const router = useRouter();
  const districtId = params.id as string;

  const { data: district, isError: districtError } = useGetDistrictQuery(districtId);
  const { data: sitesData } = useGetSitesQuery({ district_id: districtId, page_size: 500 });

  const sites = sitesData?.data ?? [];

  useEffect(() => {
    document.title = district ? `${district.name} Sites | SC-GIMS` : 'District Sites | SC-GIMS';
  }, [district]);

  if (districtError || !district) {
    return (
      <Box>
        <Typography variant="h6">District not found.</Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/admin/provinces')}
          sx={{ mt: 2 }}
        >
          Back to Provinces
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(`/admin/provinces/${district.province_id}`)}
        sx={{ mb: 2 }}
      >
        Back to {district.province_name ?? 'Province'} Districts
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          {district.name} — Sites
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push(`/sites/new?district_id=${districtId}`)}
        >
          Add Site
        </Button>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Sites located in {district.name}.
      </Typography>

      {sites.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No sites added yet for {district.name}.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {sites.map((site) => (
            <Grid key={site.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Paper
                onClick={() => router.push(`/sites/${site.id}`)}
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
                  <LocationOnIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                  <RowActionsMenu
                    actions={[
                      {
                        key: 'view',
                        label: 'View site',
                        icon: <VisibilityIcon fontSize="small" />,
                        onClick: () => router.push(`/sites/${site.id}`),
                      },
                    ]}
                  />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {site.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5, mb: 1 }}>
                  <StatusChip status={site.status} />
                </Box>
                {site.location && (
                  <Typography variant="body2" color="text.secondary">
                    {site.location}
                  </Typography>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}