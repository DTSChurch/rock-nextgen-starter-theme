<%@ Page Language="C#" MasterPageFile="Site.Master" AutoEventWireup="true" Inherits="Rock.Web.UI.RockPage" %>
<%@ Import Namespace="Rock" %>
<%@ Import Namespace="Rock.Model" %>
<%@ Import Namespace="Rock.Web.UI" %>
<%@ Import Namespace="Rock.Web.Cache" %>

<asp:Content ID="ctMain" ContentPlaceHolderID="main" runat="server">

    <asp:PlaceHolder runat="server">
        <% var page = PageCache.Get( ( ( RockPage ) Page ).PageId ); %>
        <% var showPageTitle = page.PageDisplayTitle; %>
        <% var showPageBreadcrumbs = page.PageDisplayBreadCrumb; %>
        <% if(showPageTitle) { %>
            <header class="page-title-band">
                <div class="page-content">
                    <h1 class="page-title-heading"><Rock:PageIcon ID="PageIcon" runat="server" /> <Rock:PageTitle ID="PageTitle" runat="server" /></h1>
                </div>
            </header>
        <% } %>
        <% if(showPageBreadcrumbs) { %>
            <div class="breadcrumb-container">
                <Rock:PageBreadCrumbs ID="PageBreadCrumbs" runat="server" />
            </div>
        <% } %>
    </asp:PlaceHolder>

    <!-- Start Content Area -->
    <main class="page-content">

        <Rock:Zone Name="Feature" runat="server" />

        <!-- Ajax Error -->
        <div class="alert alert-danger ajax-error" style="display:none">
            <p><strong>Error</strong></p>
            <span class="ajax-error-message"></span>
        </div>

        <div class="row">
            <div class="col-md-12">
                <Rock:Zone Name="Main" runat="server" />
            </div>
        </div>

        <div class="row">
            <div class="col-md-12">
                <Rock:Zone Name="Section A" runat="server" />
            </div>
        </div>

        <div class="row">
            <div class="col-md-4">
                <Rock:Zone Name="Section B" runat="server" />
            </div>
            <div class="col-md-4">
                <Rock:Zone Name="Section C" runat="server" />
            </div>
            <div class="col-md-4">
                <Rock:Zone Name="Section D" runat="server" />
            </div>
        </div>

    </main>
    <!-- End Content Area -->

</asp:Content>
