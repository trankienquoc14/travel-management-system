const fs = require('fs');
let c = fs.readFileSync('src/components/BookingForm.jsx', 'utf8');

const eb = `
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    this.setState({ error, info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fee2e2', color: '#b91c1c' }}>
          <h2>Something went wrong.</h2>
          <pre>{this.state.error && this.state.error.toString()}</pre>
          <pre>{this.state.info && this.state.info.componentStack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}
`;

c = c.replace('const BookingForm = () => {', eb + '\nconst BookingFormInner = () => {');
c = c.replace('export default BookingForm;', 'const BookingForm = () => <ErrorBoundary><BookingFormInner /></ErrorBoundary>;\nexport default BookingForm;');

fs.writeFileSync('src/components/BookingForm.jsx', c);
console.log('Injected ErrorBoundary');
