# frozen_string_literal: true

class CmsController < ApplicationController
  def upload
    raw = extract_raw_json
    JSON.parse(raw) # validate
    doc = JsonDocument.create!(content: raw, filename: upload_filename)
    redirect_to edit_path(doc)
  rescue JSON::ParserError => e
    redirect_to root_path, alert: "Invalid JSON — #{e.message}"
  end

  def edit
    @document = JsonDocument.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    redirect_to root_path, alert: t('errors.document_not_found')
  end

  def download
    raw      = params[:json_data].to_s
    parsed   = JSON.parse(raw)
    filename = sanitize_filename(params[:filename].presence || 'updated.json')

    send_data JSON.pretty_generate(parsed),
              filename: filename,
              type: 'application/json',
              disposition: 'attachment'
  rescue JSON::ParserError => e
    redirect_to root_path, alert: "Could not generate JSON — #{e.message}"
  end

  private

  def extract_raw_json
    return params[:file].read if params[:file].present?

    params[:json_text].to_s.strip
  end

  def upload_filename
    return params[:file].original_filename if params[:file].present?

    'data.json'
  end

  def sanitize_filename(name)
    "#{File.basename(name, '.*')}.json"
  end
end
