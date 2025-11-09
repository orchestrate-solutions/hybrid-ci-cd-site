import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect customers to the dashboard by default
  redirect('/dashboard');
}
