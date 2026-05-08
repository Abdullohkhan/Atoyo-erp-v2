import {
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TablePagination, Paper, Box, Typography,
  InputAdornment, TextField, Skeleton,
} from '@mui/material'
import { Search, InboxOutlined } from '@mui/icons-material'
import { useState } from 'react'
import type { TableColumn } from '@/shared/types/common.types'

interface Props<T extends { id: string }> {
  columns: TableColumn<T>[]
  rows: T[]
  loading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  onRowClick?: (row: T) => void
  rowActions?: (row: T) => React.ReactNode
  totalCount?: number
}

export default function DataTable<T extends { id: string }>({
  columns, rows, loading, searchable, searchPlaceholder = 'Qidirish...', onRowClick, rowActions, totalCount,
}: Props<T>) {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [search, setSearch] = useState('')

  const filtered = search
    ? rows.filter((r) =>
        Object.values(r as Record<string, unknown>).some((v) =>
          String(v).toLowerCase().includes(search.toLowerCase()),
        ),
      )
    : rows

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  return (
    <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
      {searchable && (
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            size="small" fullWidth placeholder={searchPlaceholder} value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
            sx={{ maxWidth: 340 }}
          />
        </Box>
      )}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={String(col.id)} align={col.align} sx={{ minWidth: col.minWidth }}>
                  {col.label}
                </TableCell>
              ))}
              {rowActions && <TableCell align="right">Amallar</TableCell>}
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
                  <TableCell colSpan={columns.length + (rowActions ? 1 : 0)}>
                    <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                      <InboxOutlined sx={{ fontSize: 48, opacity: 0.4 }} />
                      <Typography variant="body2">Ma'lumot topilmadi</Typography>
                    </Box>
                  </TableCell>
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
                    <TableCell key={String(col.id)} align={col.align}>
                      {col.format
                        ? col.format(row[col.id as keyof T], row)
                        : String(row[col.id as keyof T] ?? '')}
                    </TableCell>
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

      <TablePagination
        component="div"
        count={totalCount ?? filtered.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0) }}
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="Qator:"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
      />
    </Paper>
  )
}
