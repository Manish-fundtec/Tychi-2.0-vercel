'use client'

import React from 'react'
import { Button } from 'react-bootstrap'

export default function RoleActionsCellRenderer(props) {
  const { data, context } = props
  const roleId = data?.id
  const roleName = data?.name || 'Role'
  const { onEdit, onDelete, deleting } = context || {}

  const handleEdit = (e) => {
    e.stopPropagation()
    if (typeof onEdit === 'function') {
      onEdit(roleId)
    }
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (typeof onDelete === 'function') {
      onDelete(roleId, roleName)
    }
  }

  return (
    <div className="d-flex gap-2">
      <Button
        variant="outline-primary"
        size="sm"
        onClick={handleEdit}
        disabled={deleting}
      >
        Edit
      </Button>
      <Button
        variant="outline-danger"
        size="sm"
        onClick={handleDelete}
        disabled={deleting}
      >
        Delete
      </Button>
    </div>
  )
}
