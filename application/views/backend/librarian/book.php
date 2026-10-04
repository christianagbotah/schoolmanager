<style>
/* Direct UI/UX rebuild — Library Book Catalogue */
.library-books-workspace {
    margin: 0 !important;
    padding: 24px 28px 40px;
    background: #f8fafc;
    min-height: 100%;
}
.library-books-workspace > .col-md-12 { padding: 0 !important; }
.library-books-page-head {
    margin: 0 0 18px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
}
.library-books-eyebrow {
    margin: 0 0 4px;
    color: #2563eb;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: .08em;
    text-transform: uppercase;
}
.library-books-page-head h1 {
    margin: 0;
    color: #0f172a;
    font-size: 30px;
    line-height: 1.2;
    font-weight: 800;
    letter-spacing: -.02em;
}
.library-books-page-head p:last-child {
    margin: 7px 0 0;
    color: #64748b;
    font-size: 15px;
    line-height: 1.5;
}
.library-books-workspace .nav.nav-tabs.bordered {
    display: inline-flex;
    gap: 5px;
    margin: 0 0 16px !important;
    padding: 5px;
    border: 1px solid #e2e8f0 !important;
    border-radius: 12px;
    background: #fff;
}
.library-books-workspace .nav.nav-tabs.bordered > li {
    margin: 0 !important;
}
.library-books-workspace .nav.nav-tabs.bordered > li > a {
    min-height: 40px;
    padding: 9px 14px !important;
    border: 0 !important;
    border-radius: 8px !important;
    background: transparent !important;
    color: #475569 !important;
    font-size: 14px;
    font-weight: 700;
}
.library-books-workspace .nav.nav-tabs.bordered > li > a:hover {
    background: #f1f5f9 !important;
    color: #0f172a !important;
}
.library-books-workspace .nav.nav-tabs.bordered > li.active > a,
.library-books-workspace .nav.nav-tabs.bordered > li.active > a:hover,
.library-books-workspace .nav.nav-tabs.bordered > li.active > a:focus {
    background: #2563eb !important;
    color: #fff !important;
    box-shadow: 0 2px 8px rgba(37,99,235,.16);
}
.library-books-workspace .tab-content {
    padding: 0 !important;
}
.library-books-workspace .tab-content > br { display: none; }

/* Catalogue */
#list {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding: 0 !important;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
#books {
    width: 100% !important;
    min-width: 1050px;
    margin: 0 !important;
    border: 0 !important;
}
#books thead th {
    padding: 12px 13px !important;
    background: #f8fafc !important;
    color: #475569 !important;
    font-size: 13px !important;
    line-height: 1.35;
    font-weight: 800 !important;
    letter-spacing: .035em;
    border-bottom: 1px solid #e2e8f0 !important;
}
#books tbody td {
    padding: 12px 13px !important;
    color: #334155 !important;
    font-size: 14px !important;
    line-height: 1.45;
    vertical-align: middle;
    border-bottom: 1px solid #eef2f7 !important;
}
#books tbody tr:hover td { background: #f8fbff; }
#list .dataTables_wrapper {
    min-width: 1050px;
    padding: 14px;
}
#list .dataTables_length,
#list .dataTables_filter,
#list .dataTables_info,
#list .dataTables_paginate {
    color: #475569;
    font-size: 14px;
}
#list .dataTables_length select,
#list .dataTables_filter input[type="search"] {
    min-height: 40px;
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    background: #fff;
    color: #0f172a;
    font-size: 14px;
}
#books .btn,
#books button,
#books a.btn {
    min-height: 36px;
    padding: 7px 10px !important;
    border-radius: 8px !important;
    font-size: 13px !important;
    font-weight: 700 !important;
}

/* Add-book form */
#add {
    padding: 0 !important;
    background: transparent;
}
#add .box-content {
    max-width: 980px;
    padding: 20px !important;
    border: 1px solid #e2e8f0;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 1px 2px rgba(15,23,42,.05);
}
#add .form-group {
    margin: 0 0 15px !important;
}
#add .control-label {
    padding-top: 10px;
    color: #334155;
    font-size: 14px;
    line-height: 1.4;
    font-weight: 700;
    text-align: left;
}
#add .form-control,
#add .selectboxit-container .selectboxit {
    min-height: 46px !important;
    height: 46px !important;
    padding: 9px 11px !important;
    border: 1px solid #cbd5e1 !important;
    border-radius: 9px !important;
    background: #fff !important;
    color: #0f172a !important;
    font-size: 15px !important;
}
#add input[type="file"].form-control {
    height: auto !important;
    min-height: 46px !important;
}
#add .form-control:focus {
    border-color: #2563eb !important;
    box-shadow: 0 0 0 3px rgba(37,99,235,.12) !important;
    outline: none;
}
#add button[type="submit"] {
    min-height: 46px;
    padding: 10px 18px !important;
    border-radius: 9px !important;
    background: #2563eb !important;
    border-color: #2563eb !important;
    color: #fff !important;
    font-size: 15px !important;
    font-weight: 800 !important;
}
#add button[type="submit"]:hover {
    background: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
}
#add button[type="submit"][disabled] {
    opacity: .5;
    cursor: not-allowed;
}

@media (max-width: 767px) {
    .library-books-workspace { padding: 18px 14px 32px; }
    .library-books-page-head h1 { font-size: 26px; }
    .library-books-workspace .nav.nav-tabs.bordered {
        display: grid;
        grid-template-columns: 1fr;
        width: 100%;
    }
    .library-books-workspace .nav.nav-tabs.bordered > li > a { width: 100%; }
    #add .box-content { padding: 16px !important; }
    #add .control-label {
        padding-top: 0;
        margin-bottom: 7px;
    }
    #add .form-group > [class*="col-"] {
        width: 100% !important;
        float: none !important;
        padding-left: 0;
        padding-right: 0;
    }
    #add .form-control { font-size: 16px !important; }
    #add button[type="submit"] { width: 100%; }
}
</style>

<hr />
<div class="row library-books-workspace">
    <div class="col-md-12">
        <div class="library-books-page-head">
            <div>
                <p class="library-books-eyebrow">Library</p>
                <h1>Book Catalogue</h1>
                <p>Manage library titles, class assignments, copies, digital files and catalogue actions from one workspace.</p>
            </div>
        </div>


        <!---CONTROL TABS START-->
        <ul class="nav nav-tabs bordered">
            <li class="active">
                <a href="#list" data-toggle="tab"><i class="entypo-menu"></i>
                    <?php echo get_phrase('book_list');?>
                        </a></li>
            <li>
                <a href="#add" data-toggle="tab"><i class="entypo-plus-circled"></i>
                    <?php echo get_phrase('add_book');?>
                        </a></li>
        </ul>
        <!---CONTROL TABS END-->


        <div class="tab-content">
        <br>
            <!----TABLE LISTING STARTS-->
            <div class="tab-pane box active" id="list">

                <table cellpadding="0" cellspacing="0" border="0" class="table table-bordered" id="books">
                    <thead>
                        <tr>
                            <th width="40"><div><?php echo get_phrase('book_id');?></div></th>
                            <th><div><?php echo get_phrase('name');?></div></th>
                            <th><div><?php echo get_phrase('author');?></div></th>
                            <th><div><?php echo get_phrase('description');?></div></th>
                            <th><div><?php echo get_phrase('price');?></div></th>
                            <th><div><?php echo get_phrase('total_copies');?></div></th>
                            <th><div><?php echo get_phrase('class');?></div></th>
                            <!--<th><div><?php echo get_phrase('status');?></div></th>-->
                            <th><div><?php echo get_phrase('download');?></div></th>
                            <th><div><?php echo get_phrase('options');?></div></th>
                        </tr>
                    </thead>
                </table>
            </div>
            <!----TABLE LISTING ENDS--->


            <!----CREATION FORM STARTS---->
            <div class="tab-pane box" id="add" style="padding: 5px">
                <div class="box-content">
                    <?php echo form_open(site_url('librarian/book/create') , array('class' => 'form-horizontal form-groups-bordered validate','target'=>'_top','enctype'=>'multipart/form-data'));?>
                            <div class="form-group">
                                <label class="col-sm-3 control-label"><?php echo get_phrase('name');?></label>
                                <div class="col-sm-5">
                                    <input type="text" class="form-control" name="name"
                                        data-validate="required" data-message-required="<?php echo get_phrase('value_required');?>"/>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="col-sm-3 control-label"><?php echo get_phrase('author');?></label>
                                <div class="col-sm-5">
                                    <input type="text" class="form-control" name="author"/>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="col-sm-3 control-label"><?php echo get_phrase('description');?></label>
                                <div class="col-sm-5">
                                    <input type="text" class="form-control" name="description"/>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="col-sm-3 control-label"><?php echo get_phrase('price');?></label>
                                <div class="col-sm-5">
                                    <input type="text" class="form-control" name="price"/>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="col-sm-3 control-label"><?php echo get_phrase('total_copies');?></label>
                                <div class="col-sm-3">
                                    <input type="number" class="form-control" name="total_copies"/>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="col-sm-3 control-label"><?php echo get_phrase('class');?></label>
                                <div class="col-sm-5">
                                    <select name="class_id" id = "class_id" class="form-control selectboxit" style="width:100%;">
                                    <option value=""><?php echo get_phrase('select_class'); ?></option>
                                        <?php
                                  getFullClassList();
                              ?>
                                    </select>
                                </div>
                            </div>
                             <div class="form-group"> <label class="col-sm-3 control-label">File</label> <div class="col-sm-5"> <input type="file" name="file_name" class="form-control"> </div> </div>

                                <div class="form-group">
                              <div class="col-sm-offset-3 col-sm-5">
                                  <button type="submit" id = "submit" class="btn btn-info"><?php echo get_phrase('add_book');?></button>
                              </div>
                                </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>


<script type = 'text/javascript'>
    var class_id = '';
    jQuery(document).ready(function($) {
        $.fn.dataTable.ext.errMode = 'throw';
        $('#books').DataTable({
            "processing": true,
            "serverSide": true,
            "ajax":{
                "url": "<?php echo site_url('librarian/get_books') ?>",
                "dataType": "json",
                "type": "POST",
            },
            "columns": [
                { "data": "book_id" },
                { "data": "name" },
                { "data": "author" },
                { "data": "description" },
                { "data": "price" },
                { "data": "total_copies" },
                { "data": "class" },
                { "data": "download" },
                { "data": "options" },
            ],
            "columnDefs": [
                {
                    "targets": [1,2,3,5,6,7,8],
                    "orderable": false
                },
            ]
        });

        $("#submit").attr('disabled', 'disabled');
    });

    function book_edit_modal(book_id) {
        showAjaxModal('<?php echo site_url('modal/popup/modal_edit_book/');?>' + book_id);
    }

    function book_delete_confirm(book_id) {
        confirm_modal('<?php echo site_url('librarian/book/delete/');?>' + book_id);
    }

    function check_validation(){
        if(class_id !== ''){
            $('#submit').removeAttr('disabled');
        }
        else{
            $("#submit").attr('disabled', 'disabled');
        }
    }
    $('#class_id').change(function(){
        class_id = $('#class_id').val();
        check_validation();
    });
</script>