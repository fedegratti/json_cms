class CreateJsonDocuments < ActiveRecord::Migration[7.1]
  def change
    create_table :json_documents do |t|
      t.text :content, null: false
      t.string :filename, null: false, default: 'data.json'

      t.timestamps
    end
  end
end
