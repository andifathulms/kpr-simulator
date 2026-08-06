import { redirect } from 'next/navigation'

/** Indonesian is the default; English is secondary. */
export default function Index() {
  redirect('/id')
}
