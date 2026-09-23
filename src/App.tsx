import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AdminChittiLayout } from '@/components/layout/AdminChittiLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Landing } from '@/pages/Landing/Landing'
import { Dashboard } from '@/pages/Admin/Dashboard'
import { ChittiList } from '@/pages/Admin/ChittiList'
import { CreateChitti } from '@/pages/Admin/CreateChitti'
import { ChittiDetails } from '@/pages/Admin/ChittiDetails'
import { Members } from '@/pages/Admin/Members'
import { Payments } from '@/pages/Admin/Payments'
import { Cycles } from '@/pages/Admin/Cycles'
import { Lot } from '@/pages/Admin/Lot'
import { Activity } from '@/pages/Admin/Activity'
import { More } from '@/pages/Admin/More'
import { PublicChitti } from '@/pages/Chitti/PublicChitti'
import { PublicHistory } from '@/pages/Chitti/PublicHistory'
import { NotFound } from '@/pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/admin/chittis/new" element={<CreateChitti />} />

      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/chittis" element={<ChittiList />} />
        <Route path="/admin/activity" element={<Activity />} />
        <Route path="/admin/more" element={<More />} />
      </Route>

      <Route element={<AdminChittiLayout />}>
        <Route path="/admin/chittis/:id" element={<ChittiDetails />} />
        <Route path="/admin/chittis/:id/members" element={<Members />} />
        <Route path="/admin/chittis/:id/payments" element={<Payments />} />
        <Route path="/admin/chittis/:id/cycles" element={<Cycles />} />
        <Route path="/admin/chittis/:id/lot" element={<Lot />} />
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="/chitti/:id" element={<PublicChitti />} />
        <Route path="/chitti/:id/history" element={<PublicHistory />} />
      </Route>

      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  )
}
