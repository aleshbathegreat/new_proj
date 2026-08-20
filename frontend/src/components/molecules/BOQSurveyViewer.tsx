'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import type { BOQSurveyData, SurveyFilterOptions } from '@/types/boqSurvey';

interface BOQSurveyViewerProps {
  surveyData: BOQSurveyData;
  onFilterChange?: (options: SurveyFilterOptions) => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export default function BOQSurveyViewer({
  surveyData,
  onFilterChange,
  onDelete,
  isDeleting = false,
}: BOQSurveyViewerProps) {
  if (!surveyData?.data?.items) {
    return null; }
  const [view, setView] = useState<'ALL' | 'DISTRICT' | 'SITE'>('ALL');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedSite, setSelectedSite] = useState<string>('');

  // Extract unique districts and sites from survey data
  const allAllocations = surveyData.data.items.flatMap((item) => item.allocations);
  const uniqueDistricts = Array.from(new Set(allAllocations.map((a) => a.district)));
  const uniqueSites = Array.from(
    new Set(allAllocations.filter((a) => a.site).map((a) => a.site!))
  );

  const handleViewChange = (newView: typeof view) => {
    setView(newView);
    onFilterChange?.({
      view: newView,
      district_id: newView === 'DISTRICT' ? selectedDistrict : undefined,
      site_id: newView === 'SITE' ? selectedSite : undefined,
    });
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrict(districtId);
    onFilterChange?.({
      view: 'DISTRICT',
      district_id: districtId,
    });
  };

  const handleSiteChange = (siteId: string) => {
    setSelectedSite(siteId);
    onFilterChange?.({
      view: 'SITE',
      site_id: siteId,
    });
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Survey Data
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Uploaded: {new Date(surveyData.created_at).toLocaleDateString()} · {surveyData.item_count}{' '}
            items
          </Typography>
        </Box>
        {onDelete && (
          <IconButton
            size="small"
            color="error"
            onClick={onDelete}
            disabled={isDeleting}
            title="Delete survey data"
          >
            <DeleteIcon />
          </IconButton>
        )}
      </Box>

      <Box sx={{ mb: 2 }}>
        <Chip
          label={`${surveyData.level}-level breakdown`}
          size="small"
          color="primary"
          variant="outlined"
        />
      </Box>

      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <FormLabel component="legend" sx={{ mb: 1 }}>
          View
        </FormLabel>
        <RadioGroup
          row
          value={view}
          onChange={(e) => handleViewChange(e.target.value as typeof view)}
        >
          <FormControlLabel value="ALL" control={<Radio />} label="All Quantities" />
          {surveyData.level === 'DISTRICT' && (
            <FormControlLabel value="DISTRICT" control={<Radio />} label="By District" />
          )}
          {surveyData.level === 'SITE' && (
            <FormControlLabel value="SITE" control={<Radio />} label="By Site" />
          )}
        </RadioGroup>
      </FormControl>

      {view === 'DISTRICT' && uniqueDistricts.length > 0 && (
        <FormControl sx={{ mb: 2, minWidth: 200 }}>
          <Select
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            displayEmpty
            size="small"
          >
            <MenuItem value="" disabled>
              Select a district
            </MenuItem>
            {uniqueDistricts.map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {view === 'SITE' && uniqueSites.length > 0 && (
        <FormControl sx={{ mb: 2, minWidth: 200 }}>
          <Select
            value={selectedSite}
            onChange={(e) => handleSiteChange(e.target.value)}
            displayEmpty
            size="small"
          >
            <MenuItem value="" disabled>
              Select a site
            </MenuItem>
            {uniqueSites.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Paper>
  );
}