"use client"

import React from "react"
import { Dialog } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface LoginDialogProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly onLogin: (password: string) => void
}

export default function LoginDialog({ open, onClose, onLogin }: LoginDialogProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const password = formData.get("password") as string
    onLogin(password)
  }

  return (
    <Dialog open={open} onOpenChange={(openState) => { if (!openState) onClose() }}>
      <div className="p-4">
        <h2 className="text-lg font-bold">Login</h2>
        <form onSubmit={handleSubmit}>
          <Input
            name="password"
            type="password"
            placeholder="Enter password"
            required
            className="mb-2"
          />
          <Button type="submit">Login</Button>
        </form>
      </div>
    </Dialog>
  )
}