# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'CMS', type: :request do
  # ─── POST /upload ───────────────────────────────────────────────────────────

  describe 'POST /upload' do
    context 'with a valid JSON file' do
      let(:content) { '{"name":"Alice","age":30}' }
      let(:file) { Rack::Test::UploadedFile.new(StringIO.new(content), 'application/json', original_filename: 'alice.json') }

      it 'creates a JsonDocument and redirects to the edit page' do
        expect { post upload_path, params: { file: file } }.to change(JsonDocument, :count).by(1)

        doc = JsonDocument.last
        expect(response).to redirect_to(edit_path(doc))
      end

      it 'stores the original filename' do
        post upload_path, params: { file: file }

        expect(JsonDocument.last.filename).to eq('alice.json')
      end

      it 'stores the raw JSON content' do
        post upload_path, params: { file: file }

        expect(JsonDocument.last.content).to eq(content)
      end
    end

    context 'with valid pasted JSON text' do
      let(:content) { '{"pasted":true,"count":5}' }

      it 'creates a JsonDocument and redirects to the edit page' do
        expect { post upload_path, params: { json_text: content } }.to change(JsonDocument, :count).by(1)

        expect(response).to redirect_to(edit_path(JsonDocument.last))
      end

      it 'uses the default filename' do
        post upload_path, params: { json_text: content }

        expect(JsonDocument.last.filename).to eq('data.json')
      end
    end

    context 'with an invalid JSON file' do
      let(:file) { Rack::Test::UploadedFile.new(StringIO.new('not json at all'), 'application/json', original_filename: 'bad.json') }

      it 'does not create a JsonDocument' do
        expect { post upload_path, params: { file: file } }.not_to change(JsonDocument, :count)
      end

      it 'redirects to the root with an alert' do
        post upload_path, params: { file: file }

        expect(response).to redirect_to(root_path)
        expect(flash[:alert]).to match(/Invalid JSON/i)
      end
    end

    context 'with invalid pasted JSON text' do
      it 'redirects to the root with an alert' do
        post upload_path, params: { json_text: '{bad json' }

        expect(response).to redirect_to(root_path)
        expect(flash[:alert]).to match(/Invalid JSON/i)
      end
    end

    context 'with all six JSON types' do
      let(:content) do
        JSON.generate(
          string:  'hello',
          number:  3.14,
          boolean: true,
          null:    nil,
          object:  { nested: 'value' },
          array:   [1, 2, 3]
        )
      end

      it 'accepts and stores the document' do
        post upload_path, params: { json_text: content }

        expect(response).to redirect_to(edit_path(JsonDocument.last))
        parsed = JsonDocument.last.parsed_content
        expect(parsed['string']).to  eq('hello')
        expect(parsed['number']).to  eq(3.14)
        expect(parsed['boolean']).to eq(true)
        expect(parsed['null']).to    be_nil
        expect(parsed['object']).to  eq({ 'nested' => 'value' })
        expect(parsed['array']).to   eq([1, 2, 3])
      end
    end

    context 'with a JSON array at root level' do
      it 'accepts the document' do
        post upload_path, params: { json_text: '[1,"two",null]' }

        expect(response).to redirect_to(edit_path(JsonDocument.last))
      end
    end
  end

  # ─── GET /edit/:id ──────────────────────────────────────────────────────────

  describe 'GET /edit/:id' do
    context 'with an existing document' do
      let(:doc) { create(:json_document, filename: 'test.json', content: '{"x":1}') }

      it 'returns 200' do
        get edit_path(doc)

        expect(response).to have_http_status(:ok)
      end

      it 'includes the filename in the response body' do
        get edit_path(doc)

        expect(response.body).to include('test.json')
      end

      it 'embeds the JSON content in the page for the Stimulus controller' do
        get edit_path(doc)

        expect(response.body).to include(CGI.escapeHTML(doc.content))
      end
    end

    context 'with a non-existent document id' do
      it 'redirects to root with an alert' do
        get edit_path(id: 0)

        expect(response).to redirect_to(root_path)
        expect(flash[:alert]).to be_present
      end
    end
  end

  # ─── POST /download ──────────────────────────────────────────────────────────

  describe 'POST /download' do
    let(:json_data) { '{"name":"Bob","score":99}' }

    it 'returns a successful response' do
      post download_path, params: { json_data: json_data, filename: 'bob.json' }

      expect(response).to have_http_status(:ok)
    end

    it 'sets Content-Type to application/json' do
      post download_path, params: { json_data: json_data, filename: 'bob.json' }

      expect(response.content_type).to include('application/json')
    end

    it 'sends the file as an attachment' do
      post download_path, params: { json_data: json_data, filename: 'bob.json' }

      expect(response.headers['Content-Disposition']).to include('attachment')
      expect(response.headers['Content-Disposition']).to include('bob.json')
    end

    it 'returns valid, pretty-printed JSON' do
      post download_path, params: { json_data: json_data, filename: 'bob.json' }

      parsed = JSON.parse(response.body)
      expect(parsed['name']).to  eq('Bob')
      expect(parsed['score']).to eq(99)
      expect(response.body).to   include("\n") # pretty-printed
    end

    it 'enforces a .json extension regardless of the submitted filename' do
      post download_path, params: { json_data: json_data, filename: 'export.txt' }

      expect(response.headers['Content-Disposition']).to include('export.json')
    end

    it 'falls back to updated.json when no filename is provided' do
      post download_path, params: { json_data: json_data }

      expect(response.headers['Content-Disposition']).to include('updated.json')
    end

    context 'with invalid JSON' do
      it 'redirects to root with an alert' do
        post download_path, params: { json_data: '{broken', filename: 'x.json' }

        expect(response).to redirect_to(root_path)
        expect(flash[:alert]).to match(/Could not generate JSON/i)
      end
    end

    context 'with all six JSON types preserved' do
      let(:original) do
        { string: 'hi', number: 1.5, boolean: false, null: nil, object: { a: 1 }, array: [true] }
      end

      it 'round-trips the data faithfully' do
        post download_path, params: { json_data: original.to_json, filename: 'rt.json' }

        parsed = JSON.parse(response.body)
        expect(parsed['string']).to  eq('hi')
        expect(parsed['number']).to  eq(1.5)
        expect(parsed['boolean']).to eq(false)
        expect(parsed['null']).to    be_nil
        expect(parsed['object']).to  eq({ 'a' => 1 })
        expect(parsed['array']).to   eq([true])
      end
    end
  end
end
