import { createRoot } from 'react-dom/client';
import { Screen } from './screen';

const root = createRoot(document.getElementById('root'));

root.render(<Screen binary={(window as any).BINARY_BLOB} />);
