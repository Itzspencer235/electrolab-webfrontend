'use client';
import { useParams } from 'next/navigation';
import TutorialForm from '@/components/admin/TutorialForm';

export default function EditTutorialPage() {
  const { id } = useParams<{ id: string }>();
  return <TutorialForm id={id} />;
}
