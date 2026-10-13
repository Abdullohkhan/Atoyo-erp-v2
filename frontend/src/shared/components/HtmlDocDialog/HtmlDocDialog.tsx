import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { Print } from '@mui/icons-material'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

const wrap = (title: string, body: string) => `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:'Times New Roman',serif;font-size:14px;line-height:1.5;color:#000;background:#fff;margin:24px}
table{font-size:13px}th{background:#f2f2f2}@media print{body{margin:0}}</style></head><body>${body}</body></html>`

/** Shows a server-rendered HTML document (contract, act) in a sandboxed frame and prints it / saves as PDF. */
export default function HtmlDocDialog({ open, title, html, onClose }: { open: boolean; title: string; html: string; onClose: () => void }) {
  const { t } = useTranslation()
  const ref = useRef<HTMLIFrameElement>(null)
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent sx={{ p: 0, height: '70vh' }}>
        <iframe ref={ref} title={title} sandbox="allow-same-origin allow-modals" srcDoc={wrap(title, html)}
          style={{ border: 0, width: '100%', height: '100%', background: '#fff' }} />
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">{t('Yopish')}</Button>
        <Button variant="contained" startIcon={<Print />} onClick={() => ref.current?.contentWindow?.print()}>{t('Chop etish / PDF')}</Button>
      </DialogActions>
    </Dialog>
  )
}
