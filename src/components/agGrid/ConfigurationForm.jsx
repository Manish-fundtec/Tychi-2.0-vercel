{
    headerName: "Actions",
    field: "action",
    cellRendererFramework: ({ data }) => (
      <>
        <Button
          size="sm"
          variant="outline-primary"
          className="me-2"
          onClick={() => handleEdit(data)}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="outline-danger"
          onClick={() => handleDelete(data.id)}
        >
          Delete
        </Button>
      </>
    )
  }