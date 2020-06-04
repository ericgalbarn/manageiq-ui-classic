class ApplicationHelper::Toolbar::XGtlView < ApplicationHelper::Toolbar::Basic
  button_group('download_main', [
    select(
      :download_choice,
      'fa fa-download fa-lg',
      N_('Download'),
      nil,
      :items => [
        button(
          :download_text,
          'fa fa-file-text-o fa-lg',
          N_('Download these items in text format'),
          N_('Download as Text'),
          :url       => "/download_data",
          :url_parms => "?download_type=text"),
        button(
          :download_csv,
          'fa fa-file-text-o fa-lg',
          N_('Download these items in CSV format'),
          N_('Download as CSV'),
          :url       => "/download_data",
          :url_parms => "?download_type=csv"),
        button(
          :download_pdf,
          'pficon pficon-print fa-lg',
          N_('Print or export these items in PDF format'),
          N_('Print or export as PDF'),
          :klass     => ApplicationHelper::Button::Basic,
          :popup     => true,
          :url       => "/download_data",
          :url_parms => "?download_type=pdf"),
      ]
    ),
  ])
end
