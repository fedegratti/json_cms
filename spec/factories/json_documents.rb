# frozen_string_literal: true

FactoryBot.define do
  factory :json_document do
    filename { 'data.json' }
    content  { '{"key":"value"}' }
  end
end
