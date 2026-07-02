import * as Zora from '@ankhorage/zora';

import { APP_EXTENSION_COMPONENT_REGISTRY } from './appExtensionRegistry';
import { type ComponentRegistry, createComponentRegistry } from './componentRegistry';

export { APP_EXTENSION_COMPONENT_REGISTRY } from './appExtensionRegistry';
export type { ComponentRegistry } from './componentRegistry';
export { createComponentRegistry } from './componentRegistry';

type ZoraRegistryModule = Pick<
  typeof Zora,
  | 'BarcodeScannerView'
  | 'Box'
  | 'Button'
  | 'ButtonGroup'
  | 'CameraPermissionView'
  | 'Card'
  | 'ChatListItem'
  | 'Container'
  | 'Divider'
  | 'DisclosureSection'
  | 'EmptyState'
  | 'FormField'
  | 'Grid'
  | 'Heading'
  | 'Hero'
  | 'Image'
  | 'Input'
  | 'MessageBubble'
  | 'NavigationItem'
  | 'NavigationList'
  | 'Notice'
  | 'OAuthProviderButton'
  | 'OAuthProviderList'
  | 'Panel'
  | 'PostCard'
  | 'ProductCard'
  | 'Progress'
  | 'ScanOverlay'
  | 'Screen'
  | 'ScreenSection'
  | 'SectionHeader'
  | 'SettingsRow'
  | 'Stack'
  | 'Text'
  | 'Textarea'
  | 'ZoraDrawerContent'
  | 'ZoraTabBar'
>;

export const SURFACE_COMPONENT_REGISTRY: ComponentRegistry = {};

function createZoraRegistryEntries(zora: ZoraRegistryModule): ComponentRegistry {
  return {
    BarcodeScannerView: zora.BarcodeScannerView,
    Box: zora.Box,
    Button: zora.Button,
    ButtonGroup: zora.ButtonGroup,
    CameraPermissionView: zora.CameraPermissionView,
    Card: zora.Card,
    ChatListItem: zora.ChatListItem,
    Container: zora.Container,
    Divider: zora.Divider,
    DisclosureSection: zora.DisclosureSection,
    EmptyState: zora.EmptyState,
    FormField: zora.FormField,
    Grid: zora.Grid,
    Heading: zora.Heading,
    Hero: zora.Hero,
    Image: zora.Image,
    Input: zora.Input,
    MessageBubble: zora.MessageBubble,
    NavigationItem: zora.NavigationItem,
    NavigationList: zora.NavigationList,
    Notice: zora.Notice,
    OAuthProviderButton: zora.OAuthProviderButton,
    OAuthProviderList: zora.OAuthProviderList,
    Panel: zora.Panel,
    PostCard: zora.PostCard,
    ProductCard: zora.ProductCard,
    Progress: zora.Progress,
    ScanOverlay: zora.ScanOverlay,
    Screen: zora.Screen,
    ScreenSection: zora.ScreenSection,
    SectionHeader: zora.SectionHeader,
    SettingsRow: zora.SettingsRow,
    Stack: zora.Stack,
    Text: zora.Text,
    Textarea: zora.Textarea,
    ZoraDrawerContent: zora.ZoraDrawerContent,
    ZoraTabBar: zora.ZoraTabBar,
  };
}

export const ZORA_COMPONENT_REGISTRY: ComponentRegistry = createComponentRegistry(
  SURFACE_COMPONENT_REGISTRY,
  createZoraRegistryEntries(Zora),
  APP_EXTENSION_COMPONENT_REGISTRY,
);
