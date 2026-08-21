const fs = require('fs');
const fPath = 'src/components/StaffFixedTourDesigner.jsx';
let c = fs.readFileSync(fPath, 'utf8');

const ErrorBoundaryStr = `
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Crash:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div style={{padding: '50px', background: 'red', color: 'white'}}><h1>CRASH!</h1><pre>{this.state.error && this.state.error.toString()}</pre><pre>{this.state.error && this.state.error.stack}</pre></div>;
    }
    return this.props.children; 
  }
}
`;

c = c.replace(/const StaffFixedTourDesigner = \(\) => \{/, ErrorBoundaryStr + '\nconst StaffFixedTourDesignerInner = () => {');

c = c.replace(/export default StaffFixedTourDesigner;/, `
const StaffFixedTourDesigner = () => (
    <ErrorBoundary>
        <StaffFixedTourDesignerInner />
    </ErrorBoundary>
);
export default StaffFixedTourDesigner;
`);

fs.writeFileSync(fPath, c, 'utf8');
console.log('Added ErrorBoundary!');
