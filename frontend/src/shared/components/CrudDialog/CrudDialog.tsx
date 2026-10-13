import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  Grid, Switch, FormControlLabel,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { useForm, Controller, type FieldValues, type Resolver, type DefaultValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { ZodType } from 'zod'
import { useTranslation } from 'react-i18next'

export interface FieldDef {
  name: string
  label: string
  xs?: number
  type?: 'text' | 'number' | 'date' | 'select' | 'switch' | 'multiline'
  options?: { value: string; label: string }[]
}

interface Props {
  open: boolean
  title: string
  fields: FieldDef[]
  schema: ZodType
  defaultValues: Record<string, unknown>
  onClose: () => void
  onSubmit: (data: Record<string, unknown>) => Promise<void> | void
}

/** Generic create/edit dialog: fields + zod schema, with translated labels and error messages. */
export default function CrudDialog({ open, title, fields, schema, defaultValues, onClose, onSubmit }: Props) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const { control, handleSubmit, reset, formState: { errors } } = useForm<FieldValues>({
    resolver: zodResolver(schema as never) as unknown as Resolver<FieldValues>,
    defaultValues: defaultValues as DefaultValues<FieldValues>,
  })

  useEffect(() => { if (open) reset(defaultValues) }, [open, defaultValues, reset])

  const submit = handleSubmit(async (data) => {
    setSaving(true)
    try { await onSubmit(data) } finally { setSaving(false) }
  })

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{t(title)}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          {fields.map((f) => (
            <Grid key={f.name} size={{ xs: 12, sm: f.xs ?? 12 }}>
              <Controller name={f.name} control={control} render={({ field }) => {
                const err = errors[f.name]?.message as string | undefined
                if (f.type === 'switch') {
                  return <FormControlLabel control={<Switch checked={!!field.value} onChange={field.onChange} />} label={t(f.label)} />
                }
                return (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const v = e.target.value
                      field.onChange(f.type === 'number' ? (v === '' ? undefined : Number(v)) : v)
                    }}
                    label={t(f.label)} fullWidth size="small"
                    select={f.type === 'select'}
                    multiline={f.type === 'multiline'}
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : undefined}
                    slotProps={{ inputLabel: f.type === 'date' ? { shrink: true } : undefined }}
                    error={!!err} helperText={err ? t(err) : undefined}
                  >
                    {f.type === 'select' && f.options?.map((o) => <MenuItem key={o.value} value={o.value}>{t(o.label)}</MenuItem>)}
                  </TextField>
                )
              }} />
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">{t('Bekor')}</Button>
        <Button onClick={submit} variant="contained" disabled={saving}>{t('Saqlash')}</Button>
      </DialogActions>
    </Dialog>
  )
}
