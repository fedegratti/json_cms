# frozen_string_literal: true

class JsonDocument < ApplicationRecord
  validates :content, presence: true
  validates :filename, presence: true

  def parsed_content
    JSON.parse(content)
  end
end
