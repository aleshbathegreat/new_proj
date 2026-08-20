'use client';

import { Controller, Control, useFieldArray, FieldValues, ArrayPath, Path } from 'react-hook-form';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { BOQFieldDataType } from '@/types/boqTemplate';

const DATA_TYPES: { value: BOQFieldDataType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'date', label: 'Date' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'select', label: 'Select (dropdown)' },
];

interface BOQTemplateFieldEditorProps<T extends FieldValues> {
  control: Control<T, any, any>;
  name: ArrayPath<T>;
}

export default function BOQTemplateFieldEditor<T extends FieldValues>({
  control,
  name,
}: BOQTemplateFieldEditorProps<T>) {
  const { fields, append, remove } = useFieldArray({ control, name });

  const keys = fields.map((f) => (f as unknown as { key?: string }).key ?? '');
  const duplicateKeys = new Set(
    keys.filter((k, i) => k && keys.indexOf(k) !== i)
  );

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Fields
      </Typography>

      {fields.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          No fields yet — add the headings this template should capture.
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {fields.map((field, index) => (
          <Box
            key={field.id}
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 1.5,
              alignItems: { md: 'flex-start' },
              p: 1.5,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            <Controller
              name={`${name}.${index}.key` as Path<T>}
              control={control}
              render={({ field: f }) => (
                <TextField
                  {...f}
                  label="Key"
                  size="small"
                  sx={{ width: { xs: '100%', md: 160 } }}
                  error={duplicateKeys.has(f.value as string)}
                  helperText={duplicateKeys.has(f.value as string) ? 'Duplicate key' : ' '}
                />
              )}
            />

            <Controller
              name={`${name}.${index}.label` as Path<T>}
              control={control}
              render={({ field: f }) => (
                <TextField {...f} label="Label" size="small" sx={{ flex: 1, minWidth: 160 }} helperText=" " />
              )}
            />

            <Controller
              name={`${name}.${index}.data_type` as Path<T>}
              control={control}
              render={({ field: f }) => (
                <TextField
                  {...f}
                  select
                  label="Data type"
                  size="small"
                  sx={{ width: { xs: '100%', md: 160 } }}
                  helperText=" "
                >
                  {DATA_TYPES.map((dt) => (
                    <MenuItem key={dt.value} value={dt.value}>
                      {dt.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name={`${name}.${index}.unit` as Path<T>}
              control={control}
              render={({ field: f }) => (
                <TextField
                  {...f}
                  label="Unit (optional)"
                  size="small"
                  sx={{ width: { xs: '100%', md: 120 } }}
                  helperText=" "
                />
              )}
            />

            <Controller
              name={`${name}.${index}.required` as Path<T>}
              control={control}
              render={({ field: f }) => (
                <FormControlLabel
                  sx={{ whiteSpace: 'nowrap' }}
                  control={<Checkbox checked={!!f.value} onChange={(e) => f.onChange(e.target.checked)} />}
                  label="Required"
                />
              )}
            />

            <IconButton aria-label="Remove field" onClick={() => remove(index)} sx={{ mt: 0.5 }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Box>

      <Button
        startIcon={<AddIcon />}
        onClick={() =>
          append({
            key: '',
            label: '',
            data_type: 'text',
            unit: '',
            required: false,
          } as never)
        }
        sx={{ mt: 2 }}
      >
        Add field
      </Button>
    </Box>
  );
}