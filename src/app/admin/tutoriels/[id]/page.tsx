'use client';
import TutorialForm from '@/components/admin/TutorialForm';

export default function EditTutorialPage({ params }: { params: { id: string } }) {
  return <TutorialForm id={params.id} />;
}
