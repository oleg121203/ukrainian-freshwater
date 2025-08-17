import React from 'react'
import { Button } from '@/components/ui/button'

export function AdminBanner({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="fixed right-4 top-4 z-50">
      <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-lg px-3 py-2 shadow"> 
        <div className="font-semibold">Admin mode</div>
        <Button size="sm" variant="default" onClick={onOpen}>Open Admin</Button>
      </div>
    </div>
  )
}

export default AdminBanner
