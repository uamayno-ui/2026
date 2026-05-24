import type { Metadata } from 'next'
import LoginForm from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'Вхід',
  description: 'Авторизація через Bank ID НБУ, Дія.Підпис або файловий ЕЦП-ключ.',
}

export default function LoginPage() {
  return <LoginForm />
}
