list1={"anand","kishore","ram"}
a=input("Enter student name")
found=0
for i in list1:
    if(a.lower()==i):
        print("found student in list")
        found=1
        break;
if(found==0):
    print("student not found")
