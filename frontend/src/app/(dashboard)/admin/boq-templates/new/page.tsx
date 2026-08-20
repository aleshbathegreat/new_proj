'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useCreateBoqTemplateMutation } from '@/store/api/boqTemplateApi';
import BOQTemplateFieldEditor from '@/components/molecules/BOQTemplateFieldEditor';
import BOQTemplateUploader from '@/components/molecules/BOQTemplateUploader';
import type { BOQTemplateField } from '@/types/boqTemplate';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  code: z.string().min(1, 'Code is required').max(50).toLowerCase(),
  description: z.string().default(''),
  is_active: z.boolean().default(true),
  fields: z.array(
    z.object({
      key: z.string().min(1, 'Key is required'),
      label: z.string().min(1, 'Label is required'),
      data_type: z.enum(['text', 'number', 'decimal', 'date', 'boolean', 'select']),
      unit: z.string().optional(),
      required: z.boolean().optional(),
      default: z.any().optional(),
      options: z.array(z.string()).optional(),
    })
  ).min(1, 'At least one field is required'),
});

type FormValues = z.infer<typeof schema>;

export default function CreateBoqTemplatePage() {
  const router = useRouter();
  const [tab, setTab] = useState<'manual' | 'import'>('manual');
  const [createTemplate, { isLoading, error }] = useCreateBoqTemplateMutation();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      is_active: true,
      fields: [{ key: '', label: '', data_type: 'text', unit: '', required: false }],
    },
  });

  useEffect(() => {
    document.title = 'Create BOQ Template | SC-GIMS';
  }, []);

  const onSubmit = async (values: FormValues) => {
    try {
      const template = await createTemplate({
        name: values.name,
        code: values.code,
        description: values.description || '',
        source: tab === 'import' ? 'IMPORT' : 'MANUAL',
        fields: values.fields,
      }).unwrap();
      console.log(`Template ${template.id} created successfully`);
      router.push('/admin/boq-templates');
    } catch (err) {
      console.error('Failed to create template');
    }
  };

  const handleFieldsParsed = (fields: BOQTemplateField[]) => {
    setValue('fields', fields);
    setTab('manual'); // Switch to manual after import so user can review
    console.log(`Imported ${fields.length} fields — review and save`);
  };

  const apiError =
    (error as { data?: { detail?: string; [key: string]: any } })?.data?.detail ||
    (error as { data?: { [key: string]: string[] } })?.data?.code?.[0];

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push('/admin/boq-templates')}
        sx={{ mb: 2 }}
      >
        Back to Templates
      </Button>

      <Typography variant="h5" sx={{ mb: 1 }}>
        Create BOQ Template
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Define the fields that should be captured for this template. Build manually or import from Excel.
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {apiError && <Alert severity="error">{String(apiError)}</Alert>}

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Template Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    placeholder="e.g., Fiber Rollout — Standard"
                  />
                )}
              />

              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Code"
                    fullWidth
                    error={!!errors.code}
                    helperText={errors.code?.message}
                    placeholder="e.g., fiber-standard"
                  />
                )}
              />
            </Box>

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description (optional)"
                  fullWidth
                  multiline
                  rows={2}
                  helperText="What is this template for?"
                />
              )}
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                Define Fields
              </Typography>
              <Tabs value={tab} onChange={(_, v) => setTab(v as 'manual' | 'import')}>
                <Tab label="Manual" value="manual" />
                <Tab label="Import from Excel" value="import" />
              </Tabs>

              <Box sx={{ mt: 2 }}>
                {tab === 'manual' && (
                  <BOQTemplateFieldEditor control={control} name="fields" />
                )}

                {tab === 'import' && (
                  <BOQTemplateUploader onFieldsParsed={handleFieldsParsed} />
                )}
              </Box>

              {errors.fields && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {typeof errors.fields.message === 'string'
                    ? errors.fields.message
                    : 'Check your fields'}
                </Alert>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, justifyContent: 'flex-end' }}>
              <Button onClick={() => router.push('/admin/boq-templates')}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={isLoading}>
                {isLoading ? 'Creating…' : 'Create Template'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}