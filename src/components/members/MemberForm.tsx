import { useState } from 'react'
import type { FormEvent } from 'react'
import { UserPlus } from 'lucide-react'
import { TextField } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { validateMemberForm, hasErrors } from '@/utils/validation'
import type { CreateMemberInput } from '@/types'

interface MemberFormProps {
  onAdd: (input: CreateMemberInput) => void | Promise<void>
  submitLabel?: string
}

export function MemberForm({ onAdd, submitLabel = 'Add Member' }: MemberFormProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const fieldErrors = validateMemberForm(name, phone)
    setErrors(fieldErrors)
    if (hasErrors(fieldErrors)) return

    setSubmitting(true)
    try {
      await onAdd({ name: name.trim(), phone: phone.trim() })
      setName('')
      setPhone('')
      setErrors({})
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <TextField
        label="Name"
        placeholder="e.g. Rahul"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        autoComplete="off"
      />
      <TextField
        label="Phone Number (optional)"
        placeholder="98xxxxxxxx"
        inputMode="numeric"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        error={errors.phone}
        autoComplete="off"
      />
      <Button type="submit" icon={<UserPlus className="size-4" />} loading={submitting} fullWidth>
        {submitLabel}
      </Button>
    </form>
  )
}
