export interface Task {
  id: string
  title: string
  description: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
}
