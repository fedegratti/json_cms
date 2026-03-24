# JSON CMS

A web-based Content Management System for editing JSON files with a visual interface. Upload, edit, and download JSON documents through an intuitive tree-based editor.

## Features

- **Upload JSON Files**: Upload `.json` files or paste JSON content directly
- **Visual JSON Editor**: Edit JSON documents using an interactive tree-based interface
- **Real-time Validation**: Ensures JSON structure remains valid during editing
- **Download Modified Files**: Export edited JSON documents with custom filenames
- **Document Persistence**: Store and retrieve JSON documents from the database

## Technology Stack

- **Backend**: Ruby on Rails 7.1.6
- **Frontend**: Stimulus (Hotwire), HAML templates, SCSS styling
- **Database**: PostgreSQL
- **JavaScript**: ES6 modules with importmap
- **Testing**: RSpec, Factory Bot, Capybara

## Prerequisites

- Ruby 3.2.2
- PostgreSQL
- Node.js (for asset compilation)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd json_cms
   ```

2. Install dependencies:
   ```bash
   bundle install
   ```

3. Setup the database:
   ```bash
   rails db:create
   rails db:migrate
   ```

4. Start the development server:
   ```bash
   rails server
   ```

The application will be available at `http://localhost:3000`.

## Usage

### Uploading JSON Documents

1. Navigate to the home page
2. Choose one of two options:
   - **File Upload**: Click "Drag & drop or click to choose" to upload a `.json` file
   - **Direct Input**: Paste JSON content in the text area

### Editing JSON Documents

Once uploaded, you'll be redirected to the visual editor where you can:
- View JSON data in an expandable/collapsible tree structure
- Edit values directly inline
- Add or remove properties
- Navigate complex nested structures

### Downloading Edited Documents

1. Make your desired changes in the editor
2. Click the "Download JSON" button
3. The file will be downloaded with proper formatting

## API Endpoints

- `GET /` - Home page with upload interface
- `POST /upload` - Upload JSON file or content
- `GET /edit/:id` - Edit JSON document
- `POST /download` - Download edited JSON document

## Database Schema

### JsonDocument Model

| Column    | Type   | Description                    |
|-----------|--------|--------------------------------|
| id        | bigint | Primary key                    |
| content   | text   | JSON content (validated)       |
| filename  | string | Original or custom filename    |
| created_at| datetime | Document creation timestamp  |
| updated_at| datetime | Document modification timestamp |

## Testing

Run the test suite:

```bash
# Run all tests
bundle exec rspec

# Run specific test files
bundle exec rspec spec/requests/cms_spec.rb
```

## Code Quality

The project includes RuboCop for code linting:

```bash
# Run RuboCop
bundle exec rubocop

# Auto-fix violations
bundle exec rubocop -a
```

## Docker Support

The application includes Docker configuration:

```bash
# Build the image
docker build -t json-cms .

# Run with docker-compose (if available)
docker-compose up
```

## Development

### File Structure

- `app/controllers/cms_controller.rb` - Main CMS functionality
- `app/models/json_document.rb` - JSON document model with validation
- `app/javascript/controllers/json_editor_controller.js` - Interactive JSON editor
- `app/views/cms/edit.html.haml` - Editor interface
- `app/views/home/index.html.haml` - Upload interface

### Key Components

**JSON Editor Controller**: A Stimulus controller that provides:
- Tree-based JSON visualization
- In-place editing capabilities
- Expand/collapse functionality
- Real-time JSON validation

**CMS Controller**: Handles:
- File upload processing
- JSON validation and parsing
- Document persistence
- Download generation

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Run the test suite (`bundle exec rspec`)
5. Run code linting (`bundle exec rubocop`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project is available as open source under the terms of the [MIT License](LICENSE).
