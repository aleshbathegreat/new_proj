'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useGetBoqTemplateQuery, useUpdateBoqTemplateMutation } from '@/store/api/boqTemplateApi';
import BOQTemplateFieldEditor from '@/components/molecules/BOQTemplateFieldEditor';
import PageSkeleton from '@/components/atoms/PageSkeleton';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
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

export default function EditBoqTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;

  const { data: template, isLoading: loadingTemplate, error: loadError } = useGetBoqTemplateQuery(templateId);
  const [updateTemplate, { isLoading: isUpdating, error }] = useUpdateBoqTemplateMutation();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    document.title = 'Edit BOQ Template | SC-GIMS';
  }, []);

  useEffect(() => {
    if (template) {
      reset({
        name: template.name,
        description: template.description,
        is_active: template.is_active,
        fields: template.fields,
      });
    }
  }, [template, reset]);

  const onSubmit = async (values: FormValues) => {
    try {
      await updateTemplate({
        id: templateId,
        data: {
          name: values.name,
          description: values.description || '',
          is_active: values.is_active ?? true,
          fields: values.fields,
        },
      }).unwrap();
      console.log('Template updated');
      router.push('/admin/boq-templates');
    } catch (err) {
      console.error('Failed to update template');
    }
  };

  if (loadingTemplate) return <PageSkeleton />;

  if (loadError || !template) {
    return (
      <Alert severity="error">
        Failed to load template
      </Alert>
    );
  }

  const apiError =
    (error as { data?: { detail?: string } })?.data?.detail;

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
        Edit BOQ Template
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {template.name} ({template.code})
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {apiError && <Alert severity="error">{String(apiError)}</Alert>}

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
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description"
                  fullWidth
                  multiline
                  rows={2}
                  helperText="What is this template for?"
                />
              )}
            />

            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={field.value ?? true} onChange={(e) => field.onChange(e.target.checked)} />}
                  label="Active (shows in dropdown when creating BOQ)"
                />
              )}
            />

            <Box>
              <BOQTemplateFieldEditor control={control} name="fields" />
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
              <Button type="submit" variant="contained" disabled={isUpdating}>
                {isUpdating ? 'Saving…' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}