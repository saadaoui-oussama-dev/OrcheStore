import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { store, Store1Context, store2, Store2Context, StoreProvider } from './store/index.ts'

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<StoreProvider store={store} context={Store1Context}>
			<StoreProvider store={store2} context={Store2Context}>
				<App />
			</StoreProvider>
		</StoreProvider>
	</StrictMode>,
);
