import { useState } from 'react'
import toast from 'react-hot-toast'
import { useChittiOutletContext } from '@/context/chittiOutletContext'
import { CycleTimeline } from '@/components/chitti/CycleTimeline'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/Field'
import { updateCycleSchedule } from '@/services/chitti/cycles'
import { combineDateAndTime, toDateInputValue, toTimeInputValue, todayDateInputValue } from '@/utils/date'
import type { Cycle } from '@/types'

export function Cycles() {
  const { chitti, cycles, members } = useChittiOutletContext()
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null)
  const [auctionDate, setAuctionDate] = useState('')
  const [auctionTime, setAuctionTime] = useState('')
  const [saving, setSaving] = useState(false)

  function openEdit(cycle: Cycle) {
    setEditingCycle(cycle)
    setAuctionDate(toDateInputValue(cycle.auctionAt))
    setAuctionTime(toTimeInputValue(cycle.auctionAt))
  }

  async function handleSave() {
    if (!editingCycle) return
    const auctionAt = combineDateAndTime(auctionDate, auctionTime)
    setSaving(true)
    try {
      // The payment deadline tracked the auction date 1:1 at creation time
      // (see CreateChitti) and there's no separate deadline UI yet, so a
      // reschedule keeps moving both together rather than letting them drift.
      await updateCycleSchedule(chitti.id, editingCycle.id, { auctionAt, paymentDeadline: auctionAt })
      toast.success(`Cycle ${editingCycle.cycleNumber} rescheduled`)
      setEditingCycle(null)
    } catch {
      toast.error('Could not update this cycle. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">Cycles</h2>
      <CycleTimeline cycles={cycles} totalCycles={chitti.totalCycles} members={members} onEdit={openEdit} />

      <BottomSheet
        open={!!editingCycle}
        onClose={() => setEditingCycle(null)}
        title={editingCycle ? `Edit Cycle ${editingCycle.cycleNumber}` : undefined}
      >
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              label="Auction Date"
              type="date"
              min={todayDateInputValue()}
              value={auctionDate}
              onChange={(e) => setAuctionDate(e.target.value)}
            />
            <TextField
              label="Auction Time"
              type="time"
              value={auctionTime}
              onChange={(e) => setAuctionTime(e.target.value)}
            />
          </div>
          <Button fullWidth loading={saving} onClick={() => void handleSave()}>
            Save Changes
          </Button>
        </div>
      </BottomSheet>
    </div>
  )
}
