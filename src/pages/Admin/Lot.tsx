import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ShieldCheck } from 'lucide-react'
import { useChittiOutletContext } from '@/context/chittiOutletContext'
import { EligibilityList } from '@/components/auction/EligibilityList'
import { LotAnimation } from '@/components/auction/LotAnimation'
import { EmptyState } from '@/components/ui/EmptyState'
import { useLotAutoTrigger } from '@/hooks/useLotAutoTrigger'

export function Lot() {
  const { chitti, members, currentCycle, eligibility } = useChittiOutletContext()
  const navigate = useNavigate()
  const draw = useLotAutoTrigger(chitti.id, currentCycle, members, eligibility)
  // Lets an admin close the "no eligible members" dead end without it
  // auto-reopening on every render — `draw.open` itself stays true for as
  // long as the countdown is past.
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => setDismissed(false), [currentCycle?.id])

  // A winner being decided is always worth surfacing, even if this admin
  // already dismissed an earlier "no eligible members" result for this same
  // cycle (that dead end and a real decision share the same cycle id).
  useEffect(() => {
    if (draw.winner) setDismissed(false)
  }, [draw.winner])

  // Surface a `prepareLot` failure instead of leaving the modal stuck
  // shuffling forever with no error and no way to close it.
  useEffect(() => {
    if (draw.error) {
      toast.error(draw.error)
      setDismissed(true)
    }
  }, [draw.error])

  // `confirmWinner` itself (the finalize step) is handled inside
  // useLotAutoTrigger now, so both this page and the public chitti page
  // finalize the moment either one observes the winner. Just surface a
  // failure here since the admin has somewhere useful to retry from.
  useEffect(() => {
    if (draw.confirmError) toast.error(draw.confirmError)
  }, [draw.confirmError])

  const noActiveCycle = chitti.status === 'completed' || !currentCycle
  const open = draw.open && !dismissed

  function handleClose() {
    draw.acknowledge()
    if (draw.winner) {
      navigate(`/admin/chittis/${chitti.id}`)
      return
    }
    setDismissed(true)
  }

  return (
    <div className="flex flex-col gap-4">
      {noActiveCycle ? (
        <EmptyState
          icon={<ShieldCheck className="size-6" />}
          title="Chitti completed"
          description="All cycles have finished — there is no lot to run."
        />
      ) : (
        <>
          <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">Cycle {chitti.currentCycle} Lot</h2>
          <EligibilityList eligibility={eligibility} />
        </>
      )}

      {currentCycle && open && draw.cycleNumber !== null && (
        <LotAnimation
          open
          cycleNumber={draw.cycleNumber}
          amount={chitti.amount}
          hasEligibleMembers={draw.hasEligibleMembers}
          eligibleMembers={draw.eligibleMembers}
          winner={draw.winner}
          skipSpin={draw.skipSpin}
          closeLabel="Back to Chitti"
          onClose={handleClose}
          onManagePayments={() => navigate(`/admin/chittis/${chitti.id}/payments`)}
          onManageMembers={() => navigate(`/admin/chittis/${chitti.id}/members`)}
        />
      )}
    </div>
  )
}
