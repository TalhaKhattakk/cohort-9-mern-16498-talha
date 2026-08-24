import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// jsdom (Jest's simulated browser) doesn't provide these by default,
// but react-router-dom needs them
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;