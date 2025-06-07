/**
 * Plugin Registry Loader
 * 
 * This module automatically loads and registers all available plugins
 * from the plugins directory.
 */
import { pluginRegistry } from './plugin-interface';

// Import all plugin implementations
// This will cause their registration code to execute
import './wordpress-plugin';
import './whatsapp-plugin';
import './html-css-plugin';

// Export the registry for convenience
export { pluginRegistry };
