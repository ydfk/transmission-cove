import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { RpcValues } from '@/lib/types'

export function Modal({ title, description, children, onClose, wide = false, className }: { title: string; description: string; children: ReactNode; onClose: () => void; wide?: boolean; className?: string }) {
  return <Dialog open onOpenChange={open => { if (!open) onClose() }}><DialogContent className={cn('max-h-[90dvh] overflow-y-auto', wide && 'sm:max-w-3xl', className)}><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>{children}</DialogContent></Dialog>
}
export function TextField({ label, description, ...props }: React.ComponentProps<typeof Input> & { label: string; description?: string }) {
  const id = props.id ?? label
  return <Field><FieldLabel htmlFor={id}>{label}</FieldLabel><Input {...props} id={id} />{description ? <FieldDescription>{description}</FieldDescription> : null}</Field>
}
export function Choice({ value, options, onChange, label }: { value: string; options: [string, string][]; onChange: (value: string) => void; label: string }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger aria-label={label} className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectGroup>{options.map(([value, text]) => <SelectItem key={value} value={value}>{text}</SelectItem>)}</SelectGroup></SelectContent></Select>
}
export type Setting = { key: string; label: string; type?: 'number' | 'text' | 'textarea' | 'time' | 'days'; min?: number; max?: number; step?: number; options?: [string, string][]; hint?: string }
export function SettingsForm({ settings, initial, onSave, pending, compact = false }: { settings: Setting[]; initial: RpcValues; onSave: (patch: RpcValues) => Promise<unknown>; pending: boolean; compact?: boolean }) {
  const [patch, setPatch] = useState<RpcValues>({})
  const update = (key: string, value: unknown) => setPatch(previous => ({ ...previous, [key]: value }))
  const available = settings.filter(setting => initial[setting.key] !== undefined)
  return <form onSubmit={async event => { event.preventDefault(); if (Object.keys(patch).length) { try { await onSave(patch); setPatch({}) } catch { /* 错误由请求层统一显示，保留编辑内容。 */ } } }}>
    <FieldGroup className="settings-grid" data-compact={compact || undefined}>
      {available.map(setting => {
        const value = patch[setting.key] ?? initial[setting.key]
        return <Field key={setting.key} data-wide={compact && ['text', 'textarea', 'days'].includes(setting.type ?? '') || undefined} orientation={typeof value === 'boolean' || (compact && !['textarea', 'days'].includes(setting.type ?? '')) ? 'horizontal' : 'vertical'}>
          <FieldLabel htmlFor={setting.key}>{setting.label}</FieldLabel>
          {typeof value === 'boolean' ? <Switch id={setting.key} checked={value} onCheckedChange={next => update(setting.key, next)} />
            : setting.options ? <Choice label={setting.label} value={String(value)} options={setting.options} onChange={next => update(setting.key, typeof initial[setting.key] === 'number' ? Number(next) : next)} />
            : setting.type === 'textarea' ? <Textarea id={setting.key} value={String(value)} onChange={event => update(setting.key, event.target.value)} />
            : setting.type === 'days' ? <div className="flex flex-wrap gap-2">{['日', '一', '二', '三', '四', '五', '六'].map((day, i) => <label className="day-option" key={day}><input type="checkbox" checked={!!(Number(value) & (1 << i))} onChange={event => update(setting.key, event.target.checked ? Number(value) | (1 << i) : Number(value) & ~(1 << i))} />{day}</label>)}</div>
            : setting.type === 'time' ? <Input required id={setting.key} type="time" value={`${Math.floor(Number(value) / 60).toString().padStart(2, '0')}:${(Number(value) % 60).toString().padStart(2, '0')}`} onChange={event => { const [hour, minute] = event.target.value.split(':').map(Number); update(setting.key, hour * 60 + minute) }} />
            : <Input required={setting.type !== 'text'} id={setting.key} type={setting.type ?? 'number'} min={setting.min ?? 0} max={setting.max} step={setting.step ?? 1} value={String(value)} onChange={event => update(setting.key, setting.type === 'text' ? event.target.value : event.target.value === '' ? '' : Number(event.target.value))} />}
          {setting.hint ? <FieldDescription>{setting.hint}</FieldDescription> : null}
        </Field>
      })}
    </FieldGroup>
    <div className="form-footer"><span className="muted text-xs">{Object.keys(patch).length ? `${Object.keys(patch).length} 项未保存` : '显示服务器当前设置'}</span><Button disabled={pending || !Object.keys(patch).length} type="submit">{pending ? '保存中…' : '保存更改'}</Button></div>
  </form>
}
