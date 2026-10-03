<style>
/* Family design-language alignment (academics wave) - presentation only.
   Scoped to the page shell; control tabs, datatables, form actions,
   input names and dropdown menus untouched. */
#main_page .nav-tabs.bordered {
    border-bottom: 2px solid #e5e7eb;
}
#main_page .nav-tabs.bordered > li > a {
    font-size: 13px; font-weight: 600; color: #374151;
    text-transform: uppercase; letter-spacing: 0.5px;
    padding: 12px 16px; border: none; background: transparent;
}
#main_page .nav-tabs.bordered > li.active > a,
#main_page .nav-tabs.bordered > li > a:hover {
    color: #2563eb; border-bottom: 2px solid #2563eb; background: transparent;
}
#main_page .nav-tabs.bordered > li > a:focus-visible {
    outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
}
#main_page label.control-label {
    font-size: 13px; font-weight: 600; color: #374151;
}
#main_page .form-control {
    border: 1.5px solid #e5e7eb; border-radius: 10px; padding: 10px 14px;
    font-size: 14px; height: 42px; box-shadow: none;
    transition: border-color 0.2s, box-shadow 0.2s;
}
#main_page .form-control:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15); outline: none;
}
#main_page .btn {
    border-radius: 10px; font-weight: 600; font-size: 14px;
    border: none; padding: 10px 20px; transition: all 0.2s;
}
#main_page .btn-primary { background: #2563eb; color: #fff; }
#main_page .btn-danger { background: #dc2626; color: #fff; }
#main_page .btn-primary:hover, #main_page .btn-danger:hover {
    filter: brightness(0.92);
}
#main_page .btn:focus-visible {
    outline: none; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.4);
}
#main_page #table_export {
    border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;
}
#main_page #table_export thead th {
    background: #f9fafb; color: #374151;
    font-size: 13px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.5px; padding: 14px 12px;
    border-bottom: 2px solid #e5e7eb;
}
#main_page #table_export tbody td {
    padding: 12px; font-size: 14px; vertical-align: middle;
}
#main_page #table_export tbody tr:hover { background: #f9fafb; }
#main_page .dropdown-menu {
    border: 1px solid #e5e7eb; border-radius: 10px;
    box-shadow: 0 4px 16px rgba(16, 24, 40, 0.10); padding: 6px;
}
#main_page .dropdown-menu > li > a {
    padding: 8px 12px; border-radius: 8px; font-size: 14px;
}
#main_page .dropdown-menu > li > a:hover { background: #f3f4f6; }
@media (prefers-reduced-motion: reduce) {
    #main_page .btn, #main_page .form-control { transition: none; }
    #main_page .btn-primary:hover, #main_page .btn-danger:hover { filter: none; }
}
@media (max-width: 768px) {
    #main_page .form-control { font-size: 16px; }
    #main_page #table_export thead th,
    #main_page #table_export tbody td { padding: 8px; font-size: 12px; }
    #main_page .btn { width: 100%; margin-bottom: 10px; }
    #main_page .nav-tabs.bordered > li > a { padding: 10px 12px; font-size: 12px; }
}
@media (max-width: 400px) {
    #main_page .btn { padding: 10px 14px; }
}
</style>

<hr/>
<div class="row">
	<div class="col-md-12">


        <table class="table table-hover table-striped table-active w-full text-xl text-left rtl:text-right text-gray-500 dark:text-gray-600 datatable" id="table_export">
          <thead class="text-lg font-bold text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 uppercase">
              <tr>
                <th scope="col" class="px-6 py-3">class</th>
                <th scope="col" class="px-6 py-3">subject category</th>
                <th scope="col" class="px-6 py-3">subject name</th>
                <th scope="col" class="px-6 py-3">teacher</th>
              </tr>
          </thead>
            <tbody>
            	<?php $count = 1;
									foreach($subjects as $row):
                        $class = $this->db->get_where('class', array('class_id' => $row['class_id']))->result_array();
                                        foreach ($class as $c):
                                            
                                        
                                        ?>
                        <?php
                    //add section A or B if the class has more than one section
                    $section_name = $this->db->get_where('section', array('class_id' => $c['class_id']))->row()->name;
                    $class_has_more_sections = $this->db->get_where('class', array('name' => $c['name'], 'name_numeric' => $c['name_numeric']))->num_rows();
                    $sec_name = '';
                    if($class_has_more_sections > 1) {
                        $sec_name = $section_name;
                    }
                ?>
                <tr>
					<td><?php echo $this->crud_model->get_type_name_by_id('class',$row['class_id']).' '.$c['name_numeric'].$sec_name;?></td>
					<td><?php echo $this->db->get_where('subject_category_creche', array('category_id' => $row['category_id']))->row()->name;?></td>
					<td><?php echo $row['name'];?></td>
					<td><a href="<?php echo site_url($account_type.'/teacher'); ?>"><?php echo $this->crud_model->get_type_name_by_id('teacher',$row['teacher_id']);?></a></td>
					
                </tr>
                <?php endforeach;
            endforeach?>
            </tbody>
        </table>
    </div>
</div>

                
