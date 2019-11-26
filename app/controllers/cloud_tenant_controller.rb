class CloudTenantController < ApplicationController
  before_action :check_privileges
  before_action :get_session_data
  after_action :cleanup_action
  after_action :set_session_data

  include Mixins::GenericListMixin
  include Mixins::GenericButtonMixin
  include Mixins::GenericFormMixin
  include Mixins::GenericSessionMixin
  include Mixins::DashboardViewMixin
  include Mixins::GenericShowMixin
  include Mixins::BreadcrumbsMixin

  # handle buttons pressed on the button bar
  def button
    case params[:pressed]
    when "cloud_tenant_new"
      javascript_redirect(:action => "new")
    when "cloud_tenant_edit"
      javascript_redirect(:action => "edit", :id => checked_item_id)
    when 'cloud_tenant_delete'
      delete_cloud_tenants
    when "custom_button"
      # custom button screen, so return, let custom_buttons method handle everything
      custom_buttons
    else
      editable_objects = CloudTenantController.display_methods.map(&:singularize) - %w[instance image] # handled in super
      if params[:pressed].starts_with?(*editable_objects) && !params[:pressed].ends_with?('_tag')
        target_controller = editable_objects.find { |n| params[:pressed].starts_with?(n) }
        action = params[:pressed].sub("#{target_controller}_", '')
        action = "#{action}_#{target_controller.sub('cloud_', '').pluralize}" if action == 'delete'
        if action == 'detach'
          volume = find_record_with_rbac(CloudVolume, params[:miq_grid_checks])
          if volume.attachments.empty?
            render_flash(_("Cloud Volume \"%{volume_name}\" is not attached to any Instances") %
              {:volume_name => volume.name}, :error)
            return
          end
        end
        javascript_redirect(:controller => target_controller, :miq_grid_checks => params[:miq_grid_checks], :action => action)
      else
        # calling the method from Mixins::GenericButtonMixin
        super
      end
    end
  end

  def self.display_methods
    %w[instances images security_groups cloud_volumes cloud_volume_snapshots cloud_object_store_containers floating_ips
       network_ports cloud_networks cloud_subnets network_routers custom_button_events]
  end

  def new
    assert_privileges("cloud_tenant_new")
    @tenant = CloudTenant.new
    @in_a_form = true
    @ems_choices = {}
    Rbac::Filterer.filtered(ManageIQ::Providers::Openstack::CloudManager).each do |ems|
      @ems_choices[ems.name] = ems.id
      # keystone v3 allows for hierarchical tenants
      next unless ems.api_version == "v3"

      Rbac::Filterer.filtered(ems.cloud_tenants).each do |ems_cloud_tenant|
        tenant_choice_name = ems.name + " (" + ems_cloud_tenant.name + ")"
        tenant_choice_id = ems.id.to_s + ":" + ems_cloud_tenant.id.to_s
        @ems_choices[tenant_choice_name] = tenant_choice_id
      end
    end
    drop_breadcrumb(
      :name => _("Add New Cloud Tenant"),
      :url  => "/cloud_tenant/new"
    )
  end

  def create
    assert_privileges("cloud_tenant_new")
    case params[:button]
    when "cancel"
      javascript_redirect(:action    => 'show_list',
                          :flash_msg => _("Add of Cloud Tenant was cancelled by the user"))
    when "add"
      @tenant = CloudTenant.new
      options = form_params
      ems = find_record_with_rbac(ExtManagementSystem, options[:ems_id])
      options.delete(:ems_id)

      task_id = CloudTenant.create_cloud_tenant_queue(session[:userid], ems, options)

      add_flash(_("Cloud tenant creation failed: Task start failed"), :error) unless task_id.kind_of?(Integer)

      if @flash_array
        javascript_flash(:spinner_off => true)
      else
        initiate_wait_for_task(:task_id => task_id, :action => "create_finished")
      end
    end
  end

  def create_finished
    task_id = session[:async][:params][:task_id]
    tenant_name = session[:async][:params][:name]
    task = MiqTask.find(task_id)
    if MiqTask.status_ok?(task.status)
      add_flash(_("Cloud Tenant \"%{name}\" created") % {
        :name => tenant_name
      })
    else
      add_flash(_("Unable to create Cloud Tenant \"%{name}\": %{details}") % {
        :name    => tenant_name,
        :details => task.message
      }, :error)
    end

    @breadcrumbs&.pop
    session[:edit] = nil
    flash_to_session
    javascript_redirect(:action => "show_list")
  end

  def edit
    assert_privileges("cloud_tenant_edit")
    @tenant = find_record_with_rbac(CloudTenant, params[:id])
    @in_a_form = true
    drop_breadcrumb(
      :name => _("Edit Cloud Tenant \"%{name}\"") % {:name => @tenant.name},
      :url  => "/cloud_tenant/edit/#{@tenant.id}"
    )
  end

  def update
    assert_privileges("cloud_tenant_edit")
    @tenant = find_record_with_rbac(CloudTenant, params[:id])

    case params[:button]
    when "cancel"
      cancel_action(_("Edit of Cloud Tenant \"%{name}\" was cancelled by the user") % {:name => @tenant.name})

    when "save"
      options = form_params
      task_id = @tenant.update_cloud_tenant_queue(session[:userid], options)

      add_flash(_("Cloud tenant creation failed: Task start failed"), :error) unless task_id.kind_of?(Integer)

      if @flash_array
        javascript_flash(:spinner_off => true)
      else
        initiate_wait_for_task(:task_id => task_id, :action => "update_finished")
      end
    end
  end

  def update_finished
    task_id = session[:async][:params][:task_id]
    tenant_id = session[:async][:params][:id]
    tenant_name = session[:async][:params][:name]
    task = MiqTask.find(task_id)
    if MiqTask.status_ok?(task.status)
      add_flash(_("Cloud Tenant \"%{name}\" updated") % {
        :name => tenant_name
      })
    else
      add_flash(_("Unable to update Cloud Tenant \"%{name}\": %{details}") % {
        :name    => tenant_name,
        :details => task.message
      }, :error)
    end

    @breadcrumbs&.pop
    session[:edit] = nil
    flash_to_session
    javascript_redirect(:action => "show", :id => tenant_id)
  end

  def cloud_tenant_form_fields
    assert_privileges("cloud_tenant_edit")
    tenant = find_record_with_rbac(CloudTenant, params[:id])
    render :json => {
      :name => tenant.name
    }
  end

  def delete_cloud_tenants
    assert_privileges("cloud_tenant_delete")
    tenants = find_records_with_rbac(CloudTenant, checked_or_params)
    tenants_to_delete = []
    tenants.each do |tenant|
      if tenant.vms.present?
        add_flash(_("Cloud Tenant \"%{name}\" cannot be removed because it is attached to one or more Instances") %
          {:name => tenant.name}, :warning)
      else
        tenants_to_delete.push(tenant)
      end
    end
    process_cloud_tenants(tenants_to_delete, "destroy") unless tenants_to_delete.empty?

    # refresh the list if applicable
    if @lastaction == "show_list"
      show_list
      render_flash
      @refresh_partial = "layouts/gtl"
    elsif @lastaction == "show" && @layout == "cloud_tenant"
      # deleting from 'show' so we:
      if flash_errors? # either show the errors and stay on the 'show'
        render_flash
      else             # or (if we deleted what we were showing) we redirect to the listing
        flash_to_session
        javascript_redirect(:action => 'show_list')
      end
    end
  end

  private

  def textual_group_list
    [%i[properties relationships quotas], %i[tags]]
  end
  helper_method :textual_group_list

  def form_params
    options = {}
    options[:name] = params[:name] if params[:name]
    if params[:ems_id]
      ems_id_array = params[:ems_id].split(":")
      options[:ems_id] = ems_id_array[0]
      if ems_id_array.length > 1
        parent_id = find_record_with_rbac(CloudTenant, ems_id_array[1]).ems_ref
        options[:parent_id] = parent_id
      end
    end
    options
  end

  # dispatches tasks to multiple tenants
  def process_cloud_tenants(tenants, task)
    return if tenants.empty?

    if task == "destroy"
      tenants.each do |tenant|
        audit = {
          :event        => "cloud_tenant_record_delete_initiateed",
          :message      => "[#{tenant.name}] Record delete initiated",
          :target_id    => tenant.id,
          :target_class => "CloudTenant",
          :userid       => session[:userid]
        }
        AuditEvent.success(audit)
        tenant.delete_cloud_tenant_queue(session[:userid])
      end
      add_flash(n_("Delete initiated for %{number} Cloud Tenant.",
                   "Delete initiated for %{number} Cloud Tenants.",
                   tenants.length) % {:number => tenants.length})
    end
  end

  def breadcrumbs_options
    {
      :breadcrumbs => [
        {:title => _("Compute")},
        {:title => _("Clouds")},
        {:title => _("Tenants"), :url => controller_url},
      ],
      :record_info => @tenant,
    }.compact
  end

  menu_section :clo
  has_custom_buttons
end
