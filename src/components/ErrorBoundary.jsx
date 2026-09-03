import { Component } from 'react';

// Contains a render error to its own subtree, so one bad photo (e.g. a legacy blob
// the GPU can't decode) can't blank the whole canvas — it renders `fallback`
// instead (default: nothing). Also used at the app root as a last-resort net.
export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err) {
    // stay quiet in the UI, but leave a breadcrumb in the console
    console.warn('[skipped after render error]', err?.message || err);
  }
  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
