# Secure Contest Components

This directory contains three main security components designed for online coding contests and examinations that require integrity monitoring.

## Components Overview

### 1. SecureContestView.tsx
A comprehensive contest interface with built-in security features.

**Features:**
- Full-screen mode enforcement
- Tab switching detection
- Window change monitoring  
- Webcam integration
- Real-time violation tracking
- Contest timer and problem display
- Security status dashboard

**Props:**
```typescript
interface SecureContestViewProps {
  contest: Contest;
  onViolation: (violation: Omit<Violation, 'id' | 'timestamp'>) => void;
  onTimeUp?: () => void;
}
```

**Usage:**
```jsx
<SecureContestView
  contest={contestData}
  onViolation={(violation) => console.log('Violation:', violation)}
  onTimeUp={() => alert('Time up!')}
/>
```

### 2. WebcamMonitor.tsx
Real-time webcam monitoring with face detection capabilities.

**Features:**
- Face detection using mock AI (ready for TensorFlow.js integration)
- Multiple face detection
- Permission handling
- Live monitoring status
- Violation reporting

**Props:**
```typescript
interface WebcamMonitorProps {
  isActive: boolean;
  onFaceDetected: (detected: boolean) => void;
  onMultipleFaces: (count: number) => void;
  onViolation: (type: string, details: string) => void;
  className?: string;
  width?: number;
  height?: number;
}
```

**Usage:**
```jsx
<WebcamMonitor
  isActive={true}
  onFaceDetected={(detected) => setFaceDetected(detected)}
  onMultipleFaces={(count) => console.log(`${count} faces`)}
  onViolation={(type, details) => logViolation(type, details)}
  width={320}
  height={240}
/>
```

### 3. SolutionValidator.tsx
Advanced code submission analysis and plagiarism detection.

**Features:**
- Code quality analysis
- Plagiarism detection using similarity algorithms
- Typing speed analysis
- Suspicious pattern detection
- Language-specific validation
- Real-time validation progress

**Props:**
```typescript
interface SolutionValidatorProps {
  submission: CodeSubmission;
  previousSubmissions?: CodeSubmission[];
  onValidationComplete: (result: ValidationResult) => void;
  onSuspiciousActivity: (activity: string, details: string) => void;
}
```

**Usage:**
```jsx
<SolutionValidator
  submission={codeSubmission}
  previousSubmissions={previousSubmissions}
  onValidationComplete={(result) => handleValidation(result)}
  onSuspiciousActivity={(activity, details) => logSuspicious(activity, details)}
/>
```

## Dependencies

Make sure these packages are installed:

```json
{
  "react-webcam": "^7.2.0",
  "@tensorflow/tfjs": "^4.22.0",
  "@tensorflow-models/blazeface": "^0.1.0",
  "@monaco-editor/react": "^4.7.0"
}
```

## Security Features

### Violation Types Detected:
- `TAB_SWITCH`: User switched to another tab
- `WINDOW_SWITCH`: User switched to another window  
- `FULLSCREEN_EXIT`: User exited fullscreen mode
- `FACE_NOT_DETECTED`: No face detected in webcam
- `MULTIPLE_FACES`: Multiple faces detected
- `WEBCAM_PERMISSION_DENIED`: Webcam access denied
- `WEBCAM_ERROR`: Webcam technical error
- `POTENTIAL_PLAGIARISM`: High code similarity detected
- `FAST_SUBMISSION`: Unusually fast typing speed
- `SUSPICIOUS_TIMING`: Timing patterns suggest cheating

### Code Analysis Features:
- **Similarity Detection**: Uses Levenshtein distance algorithm
- **Quality Metrics**: Checks indentation, naming, structure
- **Pattern Recognition**: Detects suspicious code patterns
- **Timing Analysis**: Analyzes typing speed and submission timing
- **Language-Specific**: Custom rules for Python, Java, C++, JavaScript

## Demo

Visit `/secure-contest-demo` to see all components working together in a live demonstration.

## Production Setup

### Real Face Detection Integration

To enable real face detection, replace the mock detection in `WebcamMonitor.tsx`:

```javascript
// Install TensorFlow.js dependencies
npm install @tensorflow/tfjs @tensorflow-models/blazeface

// Replace mock detection with:
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';

const model = await blazeface.load();
const predictions = await model.estimateFaces(video, false);

return {
  detected: predictions.length > 0,
  count: predictions.length,
  confidence: predictions[0]?.probability || 0,
  lastDetection: Date.now()
};
```

### Database Integration

For production use, integrate with your database to:
- Store violation logs
- Track submission history
- Maintain plagiarism database
- Store contest configurations

### API Endpoints

Create these API endpoints for full functionality:
- `POST /api/violations` - Log security violations
- `GET /api/submissions/history` - Get previous submissions for plagiarism check
- `POST /api/validate` - Server-side code validation
- `GET /api/contests/{id}/security` - Get contest security settings

## Security Considerations

1. **Privacy**: Ensure compliance with privacy laws when using webcam monitoring
2. **Data Storage**: Securely store violation logs and webcam data
3. **False Positives**: Implement appeals process for false violation detections
4. **Performance**: Monitor system performance with active webcam monitoring
5. **Accessibility**: Provide alternatives for users who cannot use webcam features

## Browser Compatibility

- **Chrome/Edge**: Full support for all features
- **Firefox**: Limited fullscreen API support
- **Safari**: Webcam permissions may require additional user interaction
- **Mobile**: Limited functionality due to browser restrictions

## Customization

### Styling
All components use Tailwind CSS classes and can be customized via:
- CSS custom properties
- Tailwind configuration
- Component prop overrides

### Detection Sensitivity
Adjust detection thresholds in component constants:
```javascript
const DETECTION_INTERVAL = 3000; // Face detection frequency
const NO_FACE_THRESHOLD = 10000; // Alert threshold
const VIOLATION_COOLDOWN = 5000; // Cooldown between similar violations
```

### Plagiarism Thresholds
Modify similarity thresholds in `SolutionValidator.tsx`:
```javascript
if (plagiarismScore > 80) { // Adjust threshold
  suspiciousPatterns.push('HIGH_SIMILARITY');
}
```

## Contributing

When contributing to these components:
1. Test all security features thoroughly
2. Maintain backward compatibility
3. Update documentation for new features
4. Consider privacy implications
5. Test across different browsers and devices

## License

These components are part of the IDE project and follow the same licensing terms.
