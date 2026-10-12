import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Paper, Box, Typography,
  InputAdornment, TextField, Skeleton, Button, Card, useMediaQuery, useTheme,
} from '@mui/material'
import { Search, InboxOutlined, FileDownload } from '@mui/icons-material'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TableColumn } from '@/shared/types/common.types'
import { exportToExcel } from '@/shared/utils/excel'

interface Props<T extends { id: string }> {
  columns: TableColumn<T>[]
  rows: T[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  onRowClick?: (row: T) => void
  rowActions?: (row: T) => React.ReactNode
  totalCount?: number
  /** When set, an Excel export button is shown and used as the file name. */
  exportName?: string
}

const cellValue = <T,>(col: TableColumn<T>, row: T) =>
  col.exportValue ? col.exportValue(row) : (row[col.id as keyof T] as string | number | boolean | null | undefined)

export default function DataTable<T extends { id: string }>({
  columns, rows, loading, searchable, searchPlaceholder, onRowClick, rowActions, totalCount, exportName,
}: Props<T>) {
  const { t } = useTranslation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) =>
      Object.values(r as Record<string, unknown>).some((v) => String(v ?? '').toLowerCase().includes(q)),
    )
  }, [rows, search])

  const maxPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1)
  const safePage = Math.min(page, maxPage)
  const paginated = filtered.slice(safePage * rowsPerPage, safePage * rowsPerPage + rowsPerPage)
  const colSpan = columns.length + (rowActions ? 1 : 0)

  const handleExport = () => {
    void exportToExcel(
      exportName ?? 'export',
      columns.map((c) => ({ header: t(c.label), key: String(c.id) })),
      filtered.map((r) => Object.fromEntries(columns.map((c) => [String(c.id), cellValue(c, r)]))),
    )
  }

  const renderCell = (col: TableColumn<T>, row: T) =>
    col.format ? col.format(row[col.id as keyof T], row) : String(row[col.id as keyof T] ?? '')

  const empty = (
    <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
      <InboxOutlined sx={{ fontSize: 48, opacity: 0.4 }} />
      <Typography variant="body2">{t("Ma'lumot topilmadi")}</Typography>
    </Box>
  )

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
      {(searchable || exportName) && (
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1, alignItems: 'center' }}>
          {searchable && (
            <TextField
              size="small" fullWidth placeholder={searchPlaceholder ? t(searchPlaceholder) : t('Qidirish...')} value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
              sx={{ maxWidth: 340 }}
            />
          )}
          <Box sx={{ flex: 1 }} />
          {exportName && (
            <Button size="small" variant="outlined" startIcon={<FileDownload />} onClick={handleExport} disabled={loading || filtered.length === 0}>
              Excel
            </Button>
          )}
        </Box>
      )}

      {isMobile ? (
        <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="rounded" height={110} />)
            : paginated.length === 0
            ? empty
            : paginated.map((row) => {
                const [first, ...rest] = columns
                return (
                  <Card
                    key={row.id} variant="outlined"
                    onClick={() => onRowClick?.(row)}
                    sx={{ p: 1.5, borderRadius: 2.5, cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    <Box sx={{ fontWeight: 700, mb: 1 }}>{renderCell(first, row)}</Box>
                    {rest.map((col) => (
                      <Box key={String(col.id)} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, py: 0.4 }}>
                        <Typography variant="caption" color="text.secondary">{t(col.label)}</Typography>
                        <Box component="div" sx={{ fontSize: '0.85rem', textAlign: 'right' }}>{renderCell(col, row)}</Box>
                      </Box>
                    ))}
                    {rowActions && (
                      <Box sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                        {rowActions(row)}
                      </Box>
                    )}
                  </Card>
                )
              })}
        </Box>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={String(col.id)} align={col.align} sx={{ minWidth: col.minWidth }}>
                    {t(col.label)}
                  </TableCell>
                ))}
                {rowActions && <TableCell align="right">{t('Amallar')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {columns.map((col) => (
                        <TableCell key={String(col.id)}><Skeleton variant="text" /></TableCell>
                      ))}
                      {rowActions && <TableCell><Skeleton variant="text" /></TableCell>}
                    </TableRow>
                  ))
                : paginated.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={colSpan}>{empty}</TableCell>
                  </TableRow>
                )
                : paginated.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() => onRowClick?.(row)}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {columns.map((col) => (
                      <TableCell key={String(col.id)} align={col.align}>{renderCell(col, row)}</TableCell>
                    ))}
                    {rowActions && (
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        {rowActions(row)}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <TablePagination
        component="div"
        count={totalCount ?? filtered.length}
        page={safePage}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0) }}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage={t('Qator:')}
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
        sx={isMobile ? { '& .MuiTablePagination-selectLabel, & .MuiTablePagination-input': { display: 'none' } } : undefined}
      />
    </Paper>
  )
}
