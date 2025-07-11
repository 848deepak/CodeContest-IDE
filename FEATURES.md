# 🏆 CodeContest IDE - Complete Coding Contest Platform

A full-featured coding contest platform with admin panel and participant interface.

## 🚀 Features

### 🔒 Admin Panel Features

#### Contest Management
- ✅ Create and manage coding contests
- ✅ Set start/end times
- ✅ List upcoming, ongoing, and past contests
- ✅ Contest status indicators

#### Question Management
- ✅ Add coding questions to contests
- ✅ Complete question details:
  - Title and problem description
  - Input/output format specifications
  - Constraints
  - Sample input/output (visible to users)
  - Points assignment (customizable)
- ✅ Question editing and deletion
- ✅ Preview questions from participant view

#### Test Case Management
- ✅ Upload multiple test cases for evaluation
- ✅ Mark test cases as hidden or public
- ✅ Bulk test case management
- ✅ Sample test cases (shown to participants)
- ✅ Hidden test cases (for evaluation only)

#### Admin Analytics
- ✅ View submissions
- ✅ Plagiarism checker
- ✅ Leaderboard management

### 🧑‍💻 User Interface (Participant Side)

#### Contest Browsing
- ✅ List of upcoming, ongoing, and past contests
- ✅ Real-time contest status indicators
- ✅ Countdown timers for ongoing contests

#### Contest Participation
- ✅ View all coding questions in contest
- ✅ Click on question to open IDE panel
- ✅ Points display for each question

#### Code Editor (IDE)
- ✅ Monaco Editor with syntax highlighting
- ✅ Multiple language support:
  - C++ (GCC 9.2.0)
  - Java (OpenJDK 13.0.1)
  - Python 3 (3.8.1)
  - C (GCC 9.2.0)
- ✅ Code templates for each language
- ✅ Custom input testing area

#### Code Execution & Testing
- ✅ **"Run Code"** button - Test against sample input/output
- ✅ **"Submit Code"** button - Evaluate against all test cases
- ✅ Real-time execution feedback
- ✅ Custom input testing

#### Results & Feedback
- ✅ Show which test cases passed/failed
- ✅ Detailed submission results:
  - Score out of total points
  - Number of test cases passed
  - Individual test case results
  - Execution time and memory usage
- ✅ Save submission status, time, and score
- ✅ Real-time leaderboard updates

## 🛠 Technical Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (easily changeable to PostgreSQL/MySQL)
- **Code Execution**: Judge0 API
- **Editor**: Monaco Editor
- **Authentication**: Simplified (no login required)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ide-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Judge0 API key
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   - Main app: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

## 📁 Key URLs

### Admin Panel
- `/admin/contests` - Manage contests
- `/admin/contests/new` - Create new contest
- `/admin/contests/[id]` - Manage specific contest
- `/admin/contests/[id]/questions/new` - Add question to contest
- `/admin/contests/[id]/questions/[qid]/edit` - Edit question & test cases
- `/admin/submissions` - View all submissions
- `/admin/plagiarism` - Plagiarism checker

### User Interface
- `/contests` - Browse contests
- `/contests/[id]` - View contest details
- `/contests/[id]/problems/[qid]` - Solve specific problem
- `/contests/[id]/leaderboard` - Contest leaderboard

## 🎯 How to Use

### For Admins

1. **Create a Contest**
   - Go to `/admin/contests`
   - Click "Create New Contest"
   - Set title, start time, end time

2. **Add Questions**
   - Enter contest management page
   - Click "Add Question"
   - Fill in all question details:
     - Title and description
     - Input/output format
     - Constraints
     - Sample input/output
     - Points (default: 100)

3. **Add Test Cases**
   - In question creation/edit form
   - Add multiple test cases
   - Mark some as "hidden" (for evaluation)
   - Mark others as "public" (shown to users)
   - Sample input/output is always visible

4. **Manage Contest**
   - Preview questions from user view
   - Edit questions and test cases
   - Monitor submissions and leaderboard

### For Participants

1. **Browse Contests**
   - Visit `/contests`
   - See upcoming, ongoing, and past contests
   - Join active contests

2. **Solve Problems**
   - Click on a contest
   - Choose a problem to solve
   - Read problem description carefully
   - Select programming language
   - Write your solution

3. **Test & Submit**
   - Use "Run" to test with custom input
   - Test against sample cases
   - Use "Submit" for final evaluation
   - View detailed results

## 🔧 Configuration

### Judge0 API Setup
1. Get API key from RapidAPI Judge0
2. Add to `.env`:
   ```
   RAPIDAPI_KEY=your_judge0_api_key
   ```

### Database Configuration
- Default: SQLite (file-based)
- For production: Update `DATABASE_URL` in `.env` to PostgreSQL/MySQL

## 🎨 Customization

### Adding New Languages
1. Update `LANGUAGE_MAP` in `/app/api/submit/route.ts`
2. Add language to `LANGUAGES` array in problem page
3. Add default code template in `DEFAULT_CODE`

### Styling
- Uses Tailwind CSS
- Customize colors in `tailwind.config.js`
- Component styles in individual `.tsx` files

## 📊 Features Overview

| Feature | Status | Description |
|---------|--------|-------------|
| Contest Management | ✅ | Full CRUD for contests |
| Question Management | ✅ | Rich question editor with test cases |
| Multi-language Support | ✅ | C++, Java, Python, C |
| Code Execution | ✅ | Real-time code testing |
| Hidden Test Cases | ✅ | Secure evaluation system |
| Leaderboard | ✅ | Real-time rankings |
| Submissions | ✅ | Complete submission tracking |
| Plagiarism Detection | ✅ | Built-in plagiarism checker |
| Monaco Editor | ✅ | Professional code editor |
| Responsive Design | ✅ | Works on all devices |

## 🐛 Troubleshooting

### Common Issues

1. **Submit button not working**
   - Check Judge0 API key in `.env`
   - Verify network connectivity
   - Check browser console for errors

2. **Database issues**
   - Run `npx prisma generate`
   - Run `npx prisma db push`
   - Reset with `npx prisma db seed`

3. **Build errors**
   - Clear `.next` folder
   - Run `npm install` again
   - Check TypeScript errors

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🎉 Enjoy Coding!

Your complete coding contest platform is ready to use! Perfect for:
- Educational institutions
- Coding competitions
- Interview processes
- Practice platforms
- Corporate coding challenges

Happy coding! 🚀
