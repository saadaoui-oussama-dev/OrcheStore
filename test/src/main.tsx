import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { store, store2, StoreProvider } from './store/index.ts'

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<StoreProvider store={store}>
			<StoreProvider store={store2}>
				<App />
			</StoreProvider>
		</StoreProvider>
	</StrictMode>,
);
