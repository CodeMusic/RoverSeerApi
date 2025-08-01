import CourseCreation from '@/components/university/CourseCreation';
import { useSearchParams } from 'react-router-dom';

const CourseCreationPage = () => 
{
  const [searchParams] = useSearchParams();
  const initialTopic = searchParams.get('topic');

  return <CourseCreation initialTopic={initialTopic} />;
};

export default CourseCreationPage; 