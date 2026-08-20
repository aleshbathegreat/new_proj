'use client';

import { useParams, useRouter } from 'next/navigation';
import { Box, Paper, Typography, Grid, Chip, Button, Divider } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useGetBoqItemQuery } from '@/store/api/boqApi';
import PageSkeleton from '@/components/atoms/PageSkeleton';
import EmptyState from '@/components/atoms/EmptyState';

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Grid size={{ xs: 6, sm: 4, md: 3 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value ?? '—'}
      </Typography>
    </Grid>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Paper sx={{ p: 2.5, mb: 2 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        {title}
      </Typography>
      <Grid container spacing={2}>
        {children}
      </Grid>
    </Paper>
  );
}

export default function BoqItemDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: item, isLoading, isError } = useGetBoqItemQuery(params.id);

  if (isLoading) return <PageSkeleton />;
  if (isError || !item) return <EmptyState title="BOQ item not found" />;

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push(`/boq/${item.boq_id}`)}
        sx={{ mb: 2 }}
      >
        Back to BOQ
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Typography variant="h5">{item.item}</Typography>
        <Chip label={item.item_type || 'Unclassified'} size="small" />
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {item.item_description}
      </Typography>

      <Section title="Identification">
        <Field label="PC1" value={item.pc1} />
        <Field label="No." value={item.no} />
        <Field label="Model" value={item.model} />
        <Field label="Model Name" value={item.model_name} />
        <Field label="OEM" value={item.oem} />
        <Field label="HS Code" value={item.hs_code} />
        <Field label="HS Code Description" value={item.hs_code_description} />
      </Section>
      
      <Section title="Location">
        <Field label="Province" value={item.province_name} />
        <Field label="District" value={item.district_name} />
        <Field label="Site" value={item.site_name} />
        <Field label="Project" value={item.project_name} />
      </Section>      

      <Section title="Quantities">
        <Field label="Unit" value={item.unit} />
        <Field label="Package Qty" value={item.package_qty} />
        <Field label="Planned Qty" value={item.qty} />
        <Field label="Actual Qty" value={item.actual_quantity} />
        <Field label="Tolerance %" value={`${item.quantity_tolerance_pct}%`} />
      </Section>

      <Section title="Pricing (FOB)">
        <Field label="FOB (unit)" value={`${item.curr} ${item.fob}`} />
        <Field label="FOB Total" value={item.fob_total} />
        <Field label="Currency" value={item.curr} />
        <Field label="Exchange Rate" value={item.curr_rate} />
        <Field label="Tax Type" value={item.tax} />
      </Section>

      <Section title="Duties & Taxes (rates)">
        <Field label="Bank Charges %" value={`${item.bank_charges_pct}%`} />
        <Field label="Freight %" value={`${item.freight_pct}%`} />
        <Field label="Landing %" value={`${item.landing_pct}%`} />
        <Field label="Insurance %" value={`${item.insurance_pct}%`} />
        <Field label="Customs Duty %" value={`${item.cd_pct}%`} />
        <Field label="Addl. Customs Duty %" value={`${item.acd_pct}%`} />
        <Field label="Regulatory Duty %" value={`${item.rd_pct}%`} />
        <Field label="Sales Tax %" value={`${item.st_pct}%`} />
        <Field label="Addl. Sales Tax %" value={`${item.ast_pct}%`} />
        <Field label="Income Tax %" value={`${item.it_pct}%`} />
        <Field label="Cess %" value={`${item.cess_pct}%`} />
      </Section>

      <Section title="Duties & Taxes (amounts)">
        <Field label="Bank Charges" value={item.bank_charges} />
        <Field label="Freight & Insurance" value={item.freight_insurance} />
        <Field label="Price with F/I" value={item.price_with_fi} />
        <Field label="Landing" value={item.landing} />
        <Field label="Price with Landing" value={item.price_with_landing} />
        <Field label="Insurance" value={item.insurance} />
        <Field label="Price with Insurance" value={item.price_with_insurance} />
        <Field label="Custom Duty" value={item.custom_duty} />
        <Field label="Addl. Custom Duty" value={item.addl_custom_duty} />
        <Field label="Regulatory Duty" value={item.regulatory_duty} />
        <Field label="Sales Tax" value={item.sales_tax} />
        <Field label="Addl. Sales Tax" value={item.addl_sales_tax} />
        <Field label="Income Tax" value={item.income_tax} />
        <Field label="Cess Tax" value={item.cess_tax} />
      </Section>

      <Paper sx={{ p: 2.5, bgcolor: 'primary.50' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          DDP Summary
        </Typography>
        <Grid container spacing={2}>
          <Field label="DDP Unit (USD)" value={item.ddp_unit_usd} />
          <Field label="Total DDP (USD)" value={item.total_ddp_usd} />
          <Field label="DDP Unit (PKR)" value={item.ddp_unit_pkr} />
          <Field label="Total DDP (PKR)" value={item.total_ddp_pkr} />
        </Grid>
      </Paper>
    </Box>
  );
}