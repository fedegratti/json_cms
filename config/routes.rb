Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  root "home#index"

  post "/upload",     to: "cms#upload",   as: :upload
  get  "/edit/:id",   to: "cms#edit",     as: :edit
  post "/download",   to: "cms#download", as: :download
end
